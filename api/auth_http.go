package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"html"
	"net"
	"net/http"
	"net/mail"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/resend/resend-go/v3"
	"google.golang.org/api/idtoken"
)

const (
	emailAuthWindow     = time.Hour
	emailAuthIPLimit    = 20
	emailAuthEmailLimit = 6
)

type authRateLimiter struct {
	mu      sync.Mutex
	buckets map[string][]time.Time
}

func newAuthRateLimiter() *authRateLimiter {
	return &authRateLimiter{
		buckets: make(map[string][]time.Time),
	}
}

func (l *authRateLimiter) Allow(key string, limit int, window time.Duration) bool {
	if l == nil || strings.TrimSpace(key) == "" || limit <= 0 {
		return true
	}

	now := time.Now()
	cutoff := now.Add(-window)

	l.mu.Lock()
	defer l.mu.Unlock()

	kept := l.buckets[key][:0]
	for _, stamp := range l.buckets[key] {
		if stamp.After(cutoff) {
			kept = append(kept, stamp)
		}
	}

	if len(kept) >= limit {
		l.buckets[key] = kept
		return false
	}

	l.buckets[key] = append(kept, now)
	return true
}

func (s *Server) emailAuthEnabled() bool {
	return s.resend != nil && strings.TrimSpace(s.cfg.Resend.FromEmail) != ""
}

func (s *Server) googleAuthEnabled() bool {
	return strings.TrimSpace(s.cfg.Google.ClientID) != ""
}

func (s *Server) sessionTTL() time.Duration {
	return time.Duration(s.cfg.Auth.SessionTTLHours) * time.Hour
}

func (s *Server) magicLinkTTL() time.Duration {
	return time.Duration(s.cfg.Auth.MagicLinkTTLMinutes) * time.Minute
}

func (s *Server) cookieSecure() bool {
	return strings.HasPrefix(strings.ToLower(strings.TrimSpace(s.cfg.Site.BaseURL)), "https://")
}

func (s *Server) handleAuthSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	identity, err := s.optionalIdentity(r)
	if err != nil {
		s.clearSessionCookie(w)
		writeJSON(w, http.StatusOK, AuthSessionResponse{})
		return
	}

	writeJSON(w, http.StatusOK, AuthSessionResponse{
		User: authenticatedUserValue(identity),
	})
}

func (s *Server) handleStartEmailAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}
	if !s.emailAuthEnabled() {
		writeError(w, http.StatusServiceUnavailable, "email sign-in is not configured yet")
		return
	}

	var payload StartEmailAuthRequest
	if err := decodeJSONBody(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	email, emailNormalized, err := normalizeEmail(payload.Email)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	ip := clientIP(r)
	if !s.authLimiter.Allow("ip:"+ip, emailAuthIPLimit, emailAuthWindow) || !s.authLimiter.Allow("email:"+emailNormalized, emailAuthEmailLimit, emailAuthWindow) {
		writeError(w, http.StatusTooManyRequests, "too many sign-in attempts, please wait a bit and try again")
		return
	}

	flow := normalizeAuthMode(payload.Mode)
	displayName := fallbackDisplayName(payload.DisplayName, email)
	rawToken, tokenHash, err := generateOpaqueToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create sign-in link")
		return
	}

	expiresAt := time.Now().Add(s.magicLinkTTL())
	if err := s.store.InsertEmailAuthToken(
		r.Context(),
		tokenHash,
		email,
		emailNormalized,
		displayName,
		flow,
		expiresAt,
		ip,
		trimmedUserAgent(r),
	); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := s.sendMagicLinkEmail(r.Context(), email, rawToken, flow, expiresAt); err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, StartEmailAuthResponse{
		Message: fmt.Sprintf("Check %s for your secure sign-in link.", email),
	})
}

func (s *Server) handleEmailAuthCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	rawToken := strings.TrimSpace(r.URL.Query().Get("token"))
	if rawToken == "" {
		s.redirectAuthResult(w, r, "", "That sign-in link is missing or invalid.")
		return
	}

	token, err := s.store.ConsumeEmailAuthToken(r.Context(), hashToken(rawToken))
	if err != nil {
		s.redirectAuthResult(w, r, "", "That sign-in link is invalid or has expired.")
		return
	}

	account, err := s.store.UpsertEmailUser(
		r.Context(),
		token.Email,
		token.EmailNormalized,
		fallbackDisplayName(token.RequestedDisplayName, token.Email),
		time.Now().UTC(),
	)
	if err != nil {
		s.redirectAuthResult(w, r, "", "We could not finish signing you in.")
		return
	}

	if err := s.issueSession(w, r, account.UserIdentity); err != nil {
		s.redirectAuthResult(w, r, "", "We could not create your session.")
		return
	}

	s.redirectAuthResult(w, r, token.Flow, "")
}

func (s *Server) handleGoogleAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}
	if !s.googleAuthEnabled() {
		writeError(w, http.StatusServiceUnavailable, "google sign-in is not configured yet")
		return
	}

	var payload GoogleAuthRequest
	if err := decodeJSONBody(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if strings.TrimSpace(payload.Credential) == "" {
		writeError(w, http.StatusBadRequest, "google credential is required")
		return
	}

	idPayload, err := idtoken.Validate(r.Context(), payload.Credential, s.cfg.Google.ClientID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "google sign-in could not be verified")
		return
	}

	email := strings.TrimSpace(claimString(idPayload.Claims, "email"))
	emailVerified := claimBool(idPayload.Claims, "email_verified")
	displayName := fallbackDisplayName(claimString(idPayload.Claims, "name"), email)
	if email == "" || !emailVerified || strings.TrimSpace(idPayload.Subject) == "" {
		writeError(w, http.StatusUnauthorized, "google did not provide a verified email address")
		return
	}

	_, emailNormalized, err := normalizeEmail(email)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	account, err := s.store.UpsertGoogleUser(
		r.Context(),
		email,
		emailNormalized,
		displayName,
		strings.TrimSpace(idPayload.Subject),
		time.Now().UTC(),
	)
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(strings.ToLower(err.Error()), "different google account") {
			status = http.StatusConflict
		}
		writeError(w, status, err.Error())
		return
	}

	if err := s.issueSession(w, r, account.UserIdentity); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, AuthSessionResponse{
		User: authenticatedUser(account.UserIdentity),
	})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}

	if raw := s.readSessionToken(r); raw != "" {
		_ = s.store.RevokeSession(r.Context(), hashToken(raw))
	}
	s.clearSessionCookie(w)
	writeJSON(w, http.StatusOK, map[string]bool{"loggedOut": true})
}

func (s *Server) requireAuth(next func(http.ResponseWriter, *http.Request, UserIdentity)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		identity, err := s.authenticateRequest(r)
		if err != nil {
			s.clearSessionCookie(w)
			writeError(w, http.StatusUnauthorized, err.Error())
			return
		}
		next(w, r, identity)
	}
}

func (s *Server) optionalIdentity(r *http.Request) (*UserIdentity, error) {
	raw := s.readSessionToken(r)
	if raw == "" {
		return nil, nil
	}

	identity, err := s.store.LookupSessionIdentity(r.Context(), hashToken(raw))
	if err != nil {
		return nil, err
	}
	return &identity, nil
}

func (s *Server) authenticateRequest(r *http.Request) (UserIdentity, error) {
	raw := s.readSessionToken(r)
	if raw == "" {
		return UserIdentity{}, errors.New("missing session cookie")
	}

	identity, err := s.store.LookupSessionIdentity(r.Context(), hashToken(raw))
	if err != nil {
		if errors.Is(err, errNotFound) {
			return UserIdentity{}, errors.New("session has expired or is invalid")
		}
		return UserIdentity{}, err
	}
	return identity, nil
}

func (s *Server) issueSession(w http.ResponseWriter, r *http.Request, identity UserIdentity) error {
	rawToken, tokenHash, err := generateOpaqueToken()
	if err != nil {
		return fmt.Errorf("generate session token: %w", err)
	}

	if err := s.store.CreateSession(
		r.Context(),
		identity.ID,
		tokenHash,
		time.Now().Add(s.sessionTTL()),
		clientIP(r),
		trimmedUserAgent(r),
	); err != nil {
		return err
	}

	http.SetCookie(w, &http.Cookie{
		Name:     s.cfg.Auth.SessionCookieName,
		Value:    rawToken,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   s.cookieSecure(),
		MaxAge:   int(s.sessionTTL().Seconds()),
	})
	return nil
}

func (s *Server) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     s.cfg.Auth.SessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   s.cookieSecure(),
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	})
}

func (s *Server) readSessionToken(r *http.Request) string {
	cookie, err := r.Cookie(s.cfg.Auth.SessionCookieName)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(cookie.Value)
}

func (s *Server) sendMagicLinkEmail(ctx context.Context, email string, rawToken string, flow string, expiresAt time.Time) error {
	if s.resend == nil {
		return errors.New("email sign-in is not configured yet")
	}

	action := "Sign in"
	if flow == "signup" {
		action = "Confirm your email"
	}

	link := s.cfg.Site.BaseURL + "/auth/email/verify?token=" + url.QueryEscape(rawToken)
	minutesLeft := int(time.Until(expiresAt).Round(time.Minute) / time.Minute)
	if minutesLeft < 1 {
		minutesLeft = s.cfg.Auth.MagicLinkTTLMinutes
	}

	subject := fmt.Sprintf("%s to %s", action, s.cfg.Site.Name)
	text := fmt.Sprintf(
		"%s\n\nOpen this secure link to continue:\n%s\n\nThis link expires in %d minutes.",
		action,
		link,
		minutesLeft,
	)
	htmlBody := fmt.Sprintf(
		`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
			<p style="margin:0 0 12px;font-size:18px;font-weight:700">%s</p>
			<p style="margin:0 0 16px">Use the secure button below to continue to %s.</p>
			<p style="margin:0 0 20px">
				<a href="%s" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:700">%s</a>
			</p>
			<p style="margin:0 0 12px">If the button does not work, paste this link into your browser:</p>
			<p style="margin:0 0 16px;word-break:break-all"><a href="%s">%s</a></p>
			<p style="margin:0;color:#6b7280">This link expires in %d minutes.</p>
		</div>`,
		html.EscapeString(action),
		html.EscapeString(s.cfg.Site.Name),
		html.EscapeString(link),
		html.EscapeString(action),
		html.EscapeString(link),
		html.EscapeString(link),
		minutesLeft,
	)

	req := &resend.SendEmailRequest{
		From:    s.cfg.Resend.FromEmail,
		To:      []string{email},
		Subject: subject,
		Text:    text,
		Html:    htmlBody,
	}
	if replyTo := strings.TrimSpace(s.cfg.Resend.ReplyToEmail); replyTo != "" {
		req.ReplyTo = replyTo
	}

	if _, err := s.resend.Emails.SendWithContext(ctx, req); err != nil {
		return fmt.Errorf("send magic link email: %w", err)
	}
	return nil
}

func (s *Server) redirectAuthResult(w http.ResponseWriter, r *http.Request, authValue string, authError string) {
	target := url.URL{Path: "/"}
	query := target.Query()
	if strings.TrimSpace(authValue) != "" {
		query.Set("auth", strings.TrimSpace(authValue))
	}
	if strings.TrimSpace(authError) != "" {
		query.Set("authError", strings.TrimSpace(authError))
	}
	target.RawQuery = query.Encode()
	http.Redirect(w, r, target.String(), http.StatusSeeOther)
}

func (s *Server) withRequestGuards(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := s.validateRequestOrigin(r); err != nil {
			writeError(w, http.StatusForbidden, err.Error())
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) validateRequestOrigin(r *http.Request) error {
	switch r.Method {
	case http.MethodGet, http.MethodHead, http.MethodOptions:
		return nil
	}

	origin := strings.TrimSpace(r.Header.Get("Origin"))
	if origin == "" {
		return nil
	}

	allowed := map[string]struct{}{}
	if base := originKey(s.cfg.Site.BaseURL); base != "" {
		allowed[base] = struct{}{}
	}

	requestOrigin := inferRequestOrigin(r)
	if requestOrigin != "" {
		allowed[requestOrigin] = struct{}{}
	}

	if _, ok := allowed[originKey(origin)]; ok {
		return nil
	}

	return errors.New("request origin was not allowed")
}

func generateOpaqueToken() (string, string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", "", err
	}
	raw := base64.RawURLEncoding.EncodeToString(buf)
	return raw, hashToken(raw), nil
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func normalizeEmail(raw string) (string, string, error) {
	parsed, err := mail.ParseAddress(strings.TrimSpace(raw))
	if err != nil {
		return "", "", fmt.Errorf("please provide a valid email address")
	}
	email := strings.TrimSpace(parsed.Address)
	normalized := strings.ToLower(email)
	if email == "" || normalized == "" {
		return "", "", fmt.Errorf("please provide a valid email address")
	}
	return email, normalized, nil
}

func fallbackDisplayName(raw string, email string) string {
	value := strings.TrimSpace(raw)
	if value != "" {
		return value
	}
	return ownerDisplayName(UserIdentity{Email: email})
}

func normalizeAuthMode(raw string) string {
	if strings.EqualFold(strings.TrimSpace(raw), "signup") {
		return "signup"
	}
	return "login"
}

func clientIP(r *http.Request) string {
	if forwarded := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); forwarded != "" {
		return strings.TrimSpace(strings.Split(forwarded, ",")[0])
	}
	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil {
		return host
	}
	return strings.TrimSpace(r.RemoteAddr)
}

func trimmedUserAgent(r *http.Request) string {
	const limit = 255
	value := strings.TrimSpace(r.UserAgent())
	if len(value) > limit {
		return value[:limit]
	}
	return value
}

func inferRequestOrigin(r *http.Request) string {
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	if forwardedProto := strings.TrimSpace(r.Header.Get("X-Forwarded-Proto")); forwardedProto != "" {
		scheme = strings.TrimSpace(strings.Split(forwardedProto, ",")[0])
	}
	if strings.TrimSpace(r.Host) == "" {
		return ""
	}
	return originKey(scheme + "://" + strings.TrimSpace(r.Host))
}

func originKey(raw string) string {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return ""
	}
	if parsed.Scheme == "" || parsed.Host == "" {
		return ""
	}
	return strings.ToLower(parsed.Scheme) + "://" + strings.ToLower(parsed.Host)
}

func claimString(claims map[string]interface{}, key string) string {
	if claims == nil {
		return ""
	}
	raw, ok := claims[key]
	if !ok || raw == nil {
		return ""
	}
	switch typed := raw.(type) {
	case string:
		return strings.TrimSpace(typed)
	default:
		return strings.TrimSpace(fmt.Sprint(typed))
	}
}

func claimBool(claims map[string]interface{}, key string) bool {
	if claims == nil {
		return false
	}
	raw, ok := claims[key]
	if !ok || raw == nil {
		return false
	}
	switch typed := raw.(type) {
	case bool:
		return typed
	case string:
		return strings.EqualFold(strings.TrimSpace(typed), "true")
	default:
		return false
	}
}

func authenticatedUserValue(identity *UserIdentity) *AuthenticatedUser {
	if identity == nil {
		return nil
	}
	return authenticatedUser(*identity)
}
