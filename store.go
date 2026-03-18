package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	errNotFound  = errors.New("not found")
	errForbidden = errors.New("forbidden")
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(ctx context.Context, cfg DatabaseConfig) (*Store, error) {
	pool, err := pgxpool.New(ctx, cfg.ConnString())
	if err != nil {
		return nil, fmt.Errorf("connect postgres: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping postgres: %w", err)
	}

	return &Store{pool: pool}, nil
}

func (s *Store) Close() {
	if s == nil || s.pool == nil {
		return
	}
	s.pool.Close()
}

func (s *Store) EnsureUserProfile(ctx context.Context, identity SupabaseIdentity) (UserProfile, error) {
	settings := encodeJSON(defaultProfileSettings())
	row := s.pool.QueryRow(ctx, `
		insert into user_profiles (user_id, email, display_name, settings)
		values ($1, $2, $3, $4::jsonb)
		on conflict (user_id) do update
		set email = excluded.email,
			display_name = case
				when coalesce(user_profiles.display_name, '') = '' then excluded.display_name
				else user_profiles.display_name
			end,
			updated_at = now()
		returning user_id, email, display_name, settings, deleted_at
	`, identity.ID, identity.Email, ownerDisplayName(identity), settings)

	return scanProfileRow(row)
}

func (s *Store) SaveUserProfile(ctx context.Context, identity SupabaseIdentity, update ProfileUpdateRequest) (UserProfile, error) {
	displayName := strings.TrimSpace(update.DisplayName)
	if displayName == "" {
		displayName = ownerDisplayName(identity)
	}
	settings := normalizeProfileSettings(update.Settings)

	row := s.pool.QueryRow(ctx, `
		insert into user_profiles (user_id, email, display_name, settings)
		values ($1, $2, $3, $4::jsonb)
		on conflict (user_id) do update
		set email = excluded.email,
			display_name = excluded.display_name,
			settings = excluded.settings,
			updated_at = now()
		returning user_id, email, display_name, settings, deleted_at
	`, identity.ID, identity.Email, displayName, encodeJSON(settings))

	return scanProfileRow(row)
}

func (s *Store) ListPublicSongs(ctx context.Context, viewerID string) ([]SongCard, error) {
	rows, err := s.pool.Query(ctx, `
		select
			id,
			slug,
			title,
			artist,
			summary,
			description,
			owner_display_name,
			coalesce(jsonb_array_length(markers), 0),
			coalesce(jsonb_array_length(sections), 0),
			published,
			updated_at,
			owner_user_id
		from songs
		where published = true
		order by updated_at desc, title asc
	`)
	if err != nil {
		return nil, fmt.Errorf("list public songs: %w", err)
	}
	defer rows.Close()

	out := make([]SongCard, 0)
	for rows.Next() {
		card, err := scanSongCard(rows, viewerID)
		if err != nil {
			return nil, err
		}
		out = append(out, card)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate public songs: %w", err)
	}
	return out, nil
}

func (s *Store) ListUserSongs(ctx context.Context, userID string) ([]SongCard, error) {
	rows, err := s.pool.Query(ctx, `
		select
			id,
			slug,
			title,
			artist,
			summary,
			description,
			owner_display_name,
			coalesce(jsonb_array_length(markers), 0),
			coalesce(jsonb_array_length(sections), 0),
			published,
			updated_at,
			owner_user_id
		from songs
		where owner_user_id = $1
		order by updated_at desc, title asc
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("list user songs: %w", err)
	}
	defer rows.Close()

	out := make([]SongCard, 0)
	for rows.Next() {
		card, err := scanSongCard(rows, userID)
		if err != nil {
			return nil, err
		}
		out = append(out, card)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate user songs: %w", err)
	}
	return out, nil
}

func (s *Store) GetSong(ctx context.Context, songID string, viewerID string) (Song, error) {
	row := s.pool.QueryRow(ctx, `
		select
			id,
			slug,
			title,
			artist,
			summary,
			description,
			owner_user_id,
			owner_display_name,
			official_clip_url,
			tutorial_url,
			song_start_sec,
			tutorial_start_sec,
			countdown_sec,
			metronome_bpm,
			metronome_beats_per_bar,
			loop_repeat_target,
			lyrics,
			markers,
			sections,
			published,
			created_at,
			updated_at
		from songs
		where id = $1
		  and (published = true or owner_user_id = $2)
	`, songID, viewerID)

	song, err := scanSongRow(row, viewerID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Song{}, errNotFound
		}
		return Song{}, err
	}
	return song, nil
}

func (s *Store) CreateSong(ctx context.Context, identity SupabaseIdentity, payload SongPayload) (Song, error) {
	normalized, err := normalizeSongPayload(payload)
	if err != nil {
		return Song{}, err
	}

	slug, err := s.uniqueSlug(ctx, slugify(normalized.Artist, normalized.Title), "")
	if err != nil {
		return Song{}, err
	}

	row := s.pool.QueryRow(ctx, `
		insert into songs (
			slug,
			title,
			artist,
			summary,
			description,
			owner_user_id,
			owner_display_name,
			official_clip_url,
			tutorial_url,
			song_start_sec,
			tutorial_start_sec,
			countdown_sec,
			metronome_bpm,
			metronome_beats_per_bar,
			loop_repeat_target,
			lyrics,
			markers,
			sections,
			published
		)
		values (
			$1, $2, $3, $4, $5, $6, $7, $8, $9,
			$10, $11, $12, $13, $14, $15, $16,
			$17::jsonb, $18::jsonb, $19
		)
		returning
			id,
			slug,
			title,
			artist,
			summary,
			description,
			owner_user_id,
			owner_display_name,
			official_clip_url,
			tutorial_url,
			song_start_sec,
			tutorial_start_sec,
			countdown_sec,
			metronome_bpm,
			metronome_beats_per_bar,
			loop_repeat_target,
			lyrics,
			markers,
			sections,
			published,
			created_at,
			updated_at
	`, slug,
		normalized.Title,
		normalized.Artist,
		normalized.Summary,
		normalized.Description,
		identity.ID,
		ownerDisplayName(identity),
		normalized.OfficialClipURL,
		normalized.TutorialURL,
		normalized.SongStartSec,
		normalized.TutorialStartSec,
		normalized.CountdownSec,
		normalized.MetronomeBPM,
		normalized.MetronomeBeatsPerBar,
		normalized.LoopRepeatTarget,
		normalized.Lyrics,
		encodeJSON(normalized.Markers),
		encodeJSON(normalized.Sections),
		normalized.Published,
	)

	return scanSongRow(row, identity.ID)
}

func (s *Store) InsertSeedSong(ctx context.Context, slug string, payload SongPayload, ownerDisplayName string) error {
	normalized, err := normalizeSongPayload(payload)
	if err != nil {
		return err
	}

	_, err = s.pool.Exec(ctx, `
		insert into songs (
			slug,
			title,
			artist,
			summary,
			description,
			owner_display_name,
			official_clip_url,
			tutorial_url,
			song_start_sec,
			tutorial_start_sec,
			countdown_sec,
			metronome_bpm,
			metronome_beats_per_bar,
			loop_repeat_target,
			lyrics,
			markers,
			sections,
			published
		)
		values (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10, $11, $12, $13, $14, $15,
			$16::jsonb, $17::jsonb, $18
		)
		on conflict (slug) do nothing
	`, slug,
		normalized.Title,
		normalized.Artist,
		normalized.Summary,
		normalized.Description,
		ownerDisplayName,
		normalized.OfficialClipURL,
		normalized.TutorialURL,
		normalized.SongStartSec,
		normalized.TutorialStartSec,
		normalized.CountdownSec,
		normalized.MetronomeBPM,
		normalized.MetronomeBeatsPerBar,
		normalized.LoopRepeatTarget,
		normalized.Lyrics,
		encodeJSON(normalized.Markers),
		encodeJSON(normalized.Sections),
		normalized.Published,
	)
	if err != nil {
		return fmt.Errorf("insert seed song: %w", err)
	}
	return nil
}

func (s *Store) UpdateSong(ctx context.Context, identity SupabaseIdentity, songID string, payload SongPayload) (Song, error) {
	normalized, err := normalizeSongPayload(payload)
	if err != nil {
		return Song{}, err
	}

	var existingOwner string
	var existingSlug string
	err = s.pool.QueryRow(ctx, `select owner_user_id, slug from songs where id = $1`, songID).Scan(&existingOwner, &existingSlug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Song{}, errNotFound
		}
		return Song{}, fmt.Errorf("load song owner: %w", err)
	}
	if existingOwner != identity.ID {
		return Song{}, errForbidden
	}

	nextSlug, err := s.uniqueSlug(ctx, slugify(normalized.Artist, normalized.Title), songID)
	if err != nil {
		return Song{}, err
	}
	if strings.TrimSpace(existingSlug) != "" && existingSlug == nextSlug {
		nextSlug = existingSlug
	}

	row := s.pool.QueryRow(ctx, `
		update songs
		set slug = $2,
			title = $3,
			artist = $4,
			summary = $5,
			description = $6,
			owner_display_name = $7,
			official_clip_url = $8,
			tutorial_url = $9,
			song_start_sec = $10,
			tutorial_start_sec = $11,
			countdown_sec = $12,
			metronome_bpm = $13,
			metronome_beats_per_bar = $14,
			loop_repeat_target = $15,
			lyrics = $16,
			markers = $17::jsonb,
			sections = $18::jsonb,
			published = $19,
			updated_at = now()
		where id = $1
		returning
			id,
			slug,
			title,
			artist,
			summary,
			description,
			owner_user_id,
			owner_display_name,
			official_clip_url,
			tutorial_url,
			song_start_sec,
			tutorial_start_sec,
			countdown_sec,
			metronome_bpm,
			metronome_beats_per_bar,
			loop_repeat_target,
			lyrics,
			markers,
			sections,
			published,
			created_at,
			updated_at
	`, songID,
		nextSlug,
		normalized.Title,
		normalized.Artist,
		normalized.Summary,
		normalized.Description,
		ownerDisplayName(identity),
		normalized.OfficialClipURL,
		normalized.TutorialURL,
		normalized.SongStartSec,
		normalized.TutorialStartSec,
		normalized.CountdownSec,
		normalized.MetronomeBPM,
		normalized.MetronomeBeatsPerBar,
		normalized.LoopRepeatTarget,
		normalized.Lyrics,
		encodeJSON(normalized.Markers),
		encodeJSON(normalized.Sections),
		normalized.Published,
	)

	return scanSongRow(row, identity.ID)
}

func (s *Store) SoftDeleteProfile(ctx context.Context, userID string) error {
	_, err := s.pool.Exec(ctx, `
		update user_profiles
		set deleted_at = now(),
			email = '',
			settings = '{}'::jsonb,
			updated_at = now()
		where user_id = $1
	`, userID)
	if err != nil {
		return fmt.Errorf("soft delete profile: %w", err)
	}
	return nil
}

func (s *Store) uniqueSlug(ctx context.Context, base string, ignoreSongID string) (string, error) {
	if strings.TrimSpace(base) == "" {
		base = "song"
	}

	slug := base
	counter := 2
	for {
		var exists bool
		query := `select exists(select 1 from songs where slug = $1)`
		args := []any{slug}
		if ignoreSongID != "" {
			query = `select exists(select 1 from songs where slug = $1 and id <> $2)`
			args = append(args, ignoreSongID)
		}
		if err := s.pool.QueryRow(ctx, query, args...).Scan(&exists); err != nil {
			return "", fmt.Errorf("check slug %q: %w", slug, err)
		}
		if !exists {
			return slug, nil
		}
		slug = fmt.Sprintf("%s-%d", base, counter)
		counter++
	}
}

func scanProfileRow(row pgx.Row) (UserProfile, error) {
	var profile UserProfile
	var settingsRaw []byte
	if err := row.Scan(&profile.UserID, &profile.Email, &profile.DisplayName, &settingsRaw, &profile.DeletedAt); err != nil {
		return UserProfile{}, err
	}
	profile.Settings = decodeProfileSettings(settingsRaw)
	return profile, nil
}

func scanSongCard(row pgx.Row, viewerID string) (SongCard, error) {
	var card SongCard
	var ownerUserID *string
	if err := row.Scan(
		&card.ID,
		&card.Slug,
		&card.Title,
		&card.Artist,
		&card.Summary,
		&card.Description,
		&card.OwnerDisplayName,
		&card.MarkerCount,
		&card.SectionCount,
		&card.Published,
		&card.UpdatedAt,
		&ownerUserID,
	); err != nil {
		return SongCard{}, fmt.Errorf("scan song card: %w", err)
	}
	card.CanEdit = ownerUserID != nil && viewerID != "" && *ownerUserID == viewerID
	return card, nil
}

func scanSongRow(row pgx.Row, viewerID string) (Song, error) {
	var song Song
	var ownerUserID *string
	var markersRaw []byte
	var sectionsRaw []byte

	if err := row.Scan(
		&song.ID,
		&song.Slug,
		&song.Title,
		&song.Artist,
		&song.Summary,
		&song.Description,
		&ownerUserID,
		&song.OwnerDisplayName,
		&song.OfficialClipURL,
		&song.TutorialURL,
		&song.SongStartSec,
		&song.TutorialStartSec,
		&song.CountdownSec,
		&song.MetronomeBPM,
		&song.MetronomeBeatsPerBar,
		&song.LoopRepeatTarget,
		&song.Lyrics,
		&markersRaw,
		&sectionsRaw,
		&song.Published,
		&song.CreatedAt,
		&song.UpdatedAt,
	); err != nil {
		return Song{}, fmt.Errorf("scan song: %w", err)
	}

	if ownerUserID != nil {
		song.OwnerUserID = *ownerUserID
	}
	if len(markersRaw) > 0 {
		if err := json.Unmarshal(markersRaw, &song.Markers); err != nil {
			return Song{}, fmt.Errorf("decode markers: %w", err)
		}
	}
	if len(sectionsRaw) > 0 {
		if err := json.Unmarshal(sectionsRaw, &song.Sections); err != nil {
			return Song{}, fmt.Errorf("decode sections: %w", err)
		}
	}

	song.Markers = normalizeMarkers(song.Markers)
	song.Sections = normalizeSections(song.Sections)
	song.CanEdit = song.OwnerUserID != "" && viewerID != "" && song.OwnerUserID == viewerID
	return song, nil
}
