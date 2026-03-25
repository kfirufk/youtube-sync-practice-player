package main

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type userAccount struct {
	UserIdentity
	EmailNormalized string
	EmailVerifiedAt *time.Time
	GoogleSubject   string
	Settings        ProfileSettings
	DeletedAt       *time.Time
}

type pendingEmailAuthToken struct {
	Email                string
	EmailNormalized      string
	RequestedDisplayName string
	Flow                 string
	ExpiresAt            time.Time
}

type queryRower interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}

func (s *Store) InsertEmailAuthToken(
	ctx context.Context,
	tokenHash string,
	email string,
	emailNormalized string,
	displayName string,
	flow string,
	expiresAt time.Time,
	requestIP string,
	userAgent string,
) error {
	_, err := s.pool.Exec(ctx, `
		insert into email_auth_tokens (
			email,
			email_normalized,
			requested_display_name,
			flow,
			token_hash,
			expires_at,
			requested_ip,
			user_agent
		)
		values ($1, $2, $3, $4, $5, $6, nullif($7, '')::inet, $8)
	`, email, emailNormalized, displayName, flow, tokenHash, expiresAt, requestIP, userAgent)
	if err != nil {
		return fmt.Errorf("insert email auth token: %w", err)
	}
	return nil
}

func (s *Store) ConsumeEmailAuthToken(ctx context.Context, tokenHash string) (pendingEmailAuthToken, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return pendingEmailAuthToken{}, fmt.Errorf("begin consume email token: %w", err)
	}
	defer tx.Rollback(ctx)

	var token pendingEmailAuthToken
	err = tx.QueryRow(ctx, `
		select email, email_normalized, requested_display_name, flow, expires_at
		from email_auth_tokens
		where token_hash = $1
		  and used_at is null
		  and expires_at > now()
		for update
	`, tokenHash).Scan(
		&token.Email,
		&token.EmailNormalized,
		&token.RequestedDisplayName,
		&token.Flow,
		&token.ExpiresAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return pendingEmailAuthToken{}, errNotFound
		}
		return pendingEmailAuthToken{}, fmt.Errorf("load email auth token: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		update email_auth_tokens
		set used_at = now()
		where token_hash = $1
	`, tokenHash); err != nil {
		return pendingEmailAuthToken{}, fmt.Errorf("mark email auth token used: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return pendingEmailAuthToken{}, fmt.Errorf("commit email auth token: %w", err)
	}

	return token, nil
}

func (s *Store) UpsertEmailUser(ctx context.Context, email string, emailNormalized string, displayName string, verifiedAt time.Time) (userAccount, error) {
	settings := encodeJSON(defaultProfileSettings())
	row := s.pool.QueryRow(ctx, `
		insert into user_profiles (
			email,
			email_normalized,
			display_name,
			email_verified_at,
			last_login_at,
			settings
		)
		values ($1, $2, $3, $4, $4, $5::jsonb)
		on conflict (email_normalized) do update
		set email = excluded.email,
			display_name = case
				when coalesce(user_profiles.display_name, '') = '' then excluded.display_name
				else user_profiles.display_name
			end,
			email_verified_at = coalesce(user_profiles.email_verified_at, excluded.email_verified_at),
			last_login_at = excluded.last_login_at,
			deleted_at = null,
			updated_at = now()
		returning
			user_id,
			email,
			email_normalized,
			display_name,
			email_verified_at,
			google_subject,
			settings,
			deleted_at
	`, email, emailNormalized, displayName, verifiedAt, settings)

	account, err := scanUserAccountRow(row)
	if err != nil {
		return userAccount{}, fmt.Errorf("upsert email user: %w", err)
	}
	return account, nil
}

func (s *Store) UpsertGoogleUser(ctx context.Context, email string, emailNormalized string, displayName string, googleSubject string, verifiedAt time.Time) (userAccount, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return userAccount{}, fmt.Errorf("begin google upsert: %w", err)
	}
	defer tx.Rollback(ctx)

	account, err := queryUserAccount(ctx, tx, `
		select
			user_id,
			email,
			email_normalized,
			display_name,
			email_verified_at,
			google_subject,
			settings,
			deleted_at
		from user_profiles
		where google_subject = $1
	`, googleSubject)
	switch {
	case err == nil:
		row := tx.QueryRow(ctx, `
			update user_profiles
			set email = $2,
				email_normalized = $3,
				display_name = case
					when coalesce(display_name, '') = '' then $4
					else display_name
				end,
				email_verified_at = coalesce(email_verified_at, $5),
				last_login_at = $5,
				deleted_at = null,
				updated_at = now()
			where user_id = $1
			returning
				user_id,
				email,
				email_normalized,
				display_name,
				email_verified_at,
				google_subject,
				settings,
				deleted_at
		`, account.ID, email, emailNormalized, displayName, verifiedAt)
		updated, err := scanUserAccountRow(row)
		if err != nil {
			return userAccount{}, fmt.Errorf("update google user by subject: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return userAccount{}, fmt.Errorf("commit google user by subject: %w", err)
		}
		return updated, nil
	case !errors.Is(err, errNotFound):
		return userAccount{}, err
	}

	account, err = queryUserAccount(ctx, tx, `
		select
			user_id,
			email,
			email_normalized,
			display_name,
			email_verified_at,
			google_subject,
			settings,
			deleted_at
		from user_profiles
		where email_normalized = $1
	`, emailNormalized)
	switch {
	case err == nil:
		if account.GoogleSubject != "" && account.GoogleSubject != googleSubject {
			return userAccount{}, fmt.Errorf("that email is already linked to a different Google account")
		}
		row := tx.QueryRow(ctx, `
			update user_profiles
			set email = $2,
				email_normalized = $3,
				display_name = case
					when coalesce(display_name, '') = '' then $4
					else display_name
				end,
				google_subject = $5,
				email_verified_at = coalesce(email_verified_at, $6),
				last_login_at = $6,
				deleted_at = null,
				updated_at = now()
			where user_id = $1
			returning
				user_id,
				email,
				email_normalized,
				display_name,
				email_verified_at,
				google_subject,
				settings,
				deleted_at
		`, account.ID, email, emailNormalized, displayName, googleSubject, verifiedAt)
		updated, err := scanUserAccountRow(row)
		if err != nil {
			return userAccount{}, fmt.Errorf("update google user by email: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return userAccount{}, fmt.Errorf("commit google user by email: %w", err)
		}
		return updated, nil
	case !errors.Is(err, errNotFound):
		return userAccount{}, err
	}

	settings := encodeJSON(defaultProfileSettings())
	row := tx.QueryRow(ctx, `
		insert into user_profiles (
			email,
			email_normalized,
			display_name,
			google_subject,
			email_verified_at,
			last_login_at,
			settings
		)
		values ($1, $2, $3, $4, $5, $5, $6::jsonb)
		returning
			user_id,
			email,
			email_normalized,
			display_name,
			email_verified_at,
			google_subject,
			settings,
			deleted_at
	`, email, emailNormalized, displayName, googleSubject, verifiedAt, settings)

	created, err := scanUserAccountRow(row)
	if err != nil {
		return userAccount{}, fmt.Errorf("insert google user: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return userAccount{}, fmt.Errorf("commit google user: %w", err)
	}
	return created, nil
}

func (s *Store) CreateSession(ctx context.Context, userID string, sessionHash string, expiresAt time.Time, requestIP string, userAgent string) error {
	_, err := s.pool.Exec(ctx, `
		insert into user_sessions (
			user_id,
			session_hash,
			expires_at,
			requested_ip,
			user_agent
		)
		values ($1, $2, $3, nullif($4, '')::inet, $5)
	`, userID, sessionHash, expiresAt, requestIP, userAgent)
	if err != nil {
		return fmt.Errorf("create user session: %w", err)
	}
	return nil
}

func (s *Store) LookupSessionIdentity(ctx context.Context, sessionHash string) (UserIdentity, error) {
	row := s.pool.QueryRow(ctx, `
		with touched as (
			update user_sessions
			set last_seen_at = now()
			where session_hash = $1
			  and revoked_at is null
			  and expires_at > now()
			returning user_id
		)
		select user_profiles.user_id, user_profiles.email, user_profiles.display_name
		from touched
		join user_profiles on user_profiles.user_id = touched.user_id
		where user_profiles.deleted_at is null
	`, sessionHash)

	var identity UserIdentity
	if err := row.Scan(&identity.ID, &identity.Email, &identity.DisplayName); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return UserIdentity{}, errNotFound
		}
		return UserIdentity{}, fmt.Errorf("lookup session: %w", err)
	}
	return identity, nil
}

func (s *Store) RevokeSession(ctx context.Context, sessionHash string) error {
	_, err := s.pool.Exec(ctx, `
		update user_sessions
		set revoked_at = now()
		where session_hash = $1
		  and revoked_at is null
	`, sessionHash)
	if err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}
	return nil
}

func (s *Store) RevokeAllSessionsForUser(ctx context.Context, userID string) error {
	_, err := s.pool.Exec(ctx, `
		update user_sessions
		set revoked_at = now()
		where user_id = $1
		  and revoked_at is null
	`, userID)
	if err != nil {
		return fmt.Errorf("revoke user sessions: %w", err)
	}
	return nil
}

func queryUserAccount(ctx context.Context, q queryRower, query string, args ...any) (userAccount, error) {
	account, err := scanUserAccountRow(q.QueryRow(ctx, query, args...))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return userAccount{}, errNotFound
		}
		return userAccount{}, err
	}
	return account, nil
}

func scanUserAccountRow(row pgx.Row) (userAccount, error) {
	var account userAccount
	var settingsRaw []byte
	var googleSubject *string

	if err := row.Scan(
		&account.ID,
		&account.Email,
		&account.EmailNormalized,
		&account.DisplayName,
		&account.EmailVerifiedAt,
		&googleSubject,
		&settingsRaw,
		&account.DeletedAt,
	); err != nil {
		return userAccount{}, err
	}

	if googleSubject != nil {
		account.GoogleSubject = strings.TrimSpace(*googleSubject)
	}
	account.Settings = decodeProfileSettings(settingsRaw)
	return account, nil
}
