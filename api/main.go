package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"time"
)

type Server struct {
	cfg         Config
	store       *Store
	clientDir   string
	projectRoot string
	httpClient  *http.Client
}

func main() {
	var configPath string
	flag.StringVar(&configPath, "config", "config.yaml", "Path to YAML config")
	flag.Parse()

	absConfigPath, err := filepath.Abs(configPath)
	if err != nil {
		log.Fatalf("resolve config path: %v", err)
	}
	apiDir := filepath.Dir(absConfigPath)
	projectRoot := filepath.Dir(apiDir)
	clientDir := filepath.Join(projectRoot, "client")

	cfg, err := LoadConfig(configPath)
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	ctx := context.Background()
	store, err := NewStore(ctx, cfg.Database)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer store.Close()

	if err := ApplySQLPatches(ctx, store.pool, filepath.Join(apiDir, "db", "patches")); err != nil {
		log.Fatalf("apply SQL patches: %v", err)
	}
	if err := BootstrapLegacySeeds(ctx, store, apiDir); err != nil {
		log.Fatalf("bootstrap legacy seed: %v", err)
	}

	server := &Server{
		cfg:         cfg,
		store:       store,
		clientDir:   clientDir,
		projectRoot: projectRoot,
		httpClient: &http.Client{
			Timeout: 12 * time.Second,
		},
	}

	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Printf("Practice Sync Player listening on http://%s", addr)

	httpServer := &http.Server{
		Addr:              addr,
		Handler:           server.routes(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server error: %v", err)
	}
}

func (s *Server) routes() http.Handler {
	apiMux := http.NewServeMux()
	apiMux.HandleFunc("/api/health", s.handleHealth)
	apiMux.HandleFunc("/api/bootstrap", s.handleBootstrap)
	apiMux.HandleFunc("/api/songs", s.handleSongs)
	apiMux.HandleFunc("/api/songs/", s.handleSongByID)
	apiMux.HandleFunc("/api/me/profile", s.requireAuth(s.handleProfile))
	apiMux.HandleFunc("/api/me/songs", s.requireAuth(s.handleMySongs))
	apiMux.HandleFunc("/api/me/songs/", s.requireAuth(s.handleMySongByID))
	apiMux.HandleFunc("/api/me/account/delete", s.requireAuth(s.handleDeleteAccount))

	rootMux := http.NewServeMux()
	rootMux.Handle("/api/", apiMux)
	rootMux.HandleFunc("/", s.handleStatic)

	return s.withSecurityHeaders(rootMux)
}

func (s *Server) handleStatic(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if path == "/" {
		http.ServeFile(w, r, filepath.Join(s.clientDir, "index.html"))
		return
	}

	allowed := map[string]string{
		"/index.html":   filepath.Join(s.clientDir, "index.html"),
		"/app.js":       filepath.Join(s.clientDir, "app.js"),
		"/styles.css":   filepath.Join(s.clientDir, "styles.css"),
		"/privacy.html": filepath.Join(s.clientDir, "privacy.html"),
		"/terms.html":   filepath.Join(s.clientDir, "terms.html"),
		"/cookies.html": filepath.Join(s.clientDir, "cookies.html"),
		"/LICENSE":      filepath.Join(s.projectRoot, "LICENSE"),
	}

	target, ok := allowed[path]
	if !ok {
		http.NotFound(w, r)
		return
	}

	http.ServeFile(w, r, target)
}

func (s *Server) withSecurityHeaders(next http.Handler) http.Handler {
	connectSrc := "connect-src 'self' " + s.cfg.Supabase.URL + " https://www.youtube.com https://www.googleapis.com"
	csp := strings.Join([]string{
		"default-src 'self'",
		"script-src 'self' https://www.youtube.com https://s.ytimg.com https://cdn.jsdelivr.net",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: https://i.ytimg.com https://img.youtube.com",
		"frame-src https://www.youtube.com https://www.youtube-nocookie.com",
		connectSrc,
		"font-src 'self'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
	}, "; ")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", csp)
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "SAMEORIGIN")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		next.ServeHTTP(w, r)
	})
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleBootstrap(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	writeJSON(w, http.StatusOK, BootstrapResponse{
		Site: SiteBootstrap{
			Name:         s.cfg.Site.Name,
			Domain:       s.cfg.Site.Domain,
			BaseURL:      s.cfg.Site.BaseURL,
			ContactEmail: s.cfg.Site.ContactEmail,
			PrivacyURL:   "/privacy.html",
			TermsURL:     "/terms.html",
			CookiesURL:   "/cookies.html",
			LicenseURL:   "/LICENSE",
		},
		Supabase: SupabasePublic{
			URL:            s.cfg.Supabase.URL,
			PublishableKey: s.cfg.Supabase.PublishableKey,
		},
		Features: FeatureFlags{
			AccountDeletionEnabled: s.cfg.Supabase.ServiceRoleKey != "",
		},
		DefaultSettings: defaultProfileSettings(),
	})
}

func (s *Server) handleSongs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	identity, _ := s.optionalIdentity(r)
	viewerID := ""
	if identity != nil {
		viewerID = identity.ID
	}

	songs, err := s.store.ListPublicSongs(r.Context(), viewerID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, songs)
}

func (s *Server) handleSongByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeMethodNotAllowed(w)
		return
	}

	songID := strings.TrimSpace(strings.TrimPrefix(r.URL.Path, "/api/songs/"))
	if songID == "" || songID == "/api/songs/" {
		writeError(w, http.StatusNotFound, "song not found")
		return
	}

	identity, _ := s.optionalIdentity(r)
	viewerID := ""
	if identity != nil {
		viewerID = identity.ID
	}

	song, err := s.store.GetSong(r.Context(), songID, viewerID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, errNotFound) {
			status = http.StatusNotFound
		}
		writeError(w, status, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, song)
}

func (s *Server) handleProfile(w http.ResponseWriter, r *http.Request, identity SupabaseIdentity) {
	switch r.Method {
	case http.MethodGet:
		profile, err := s.store.EnsureUserProfile(r.Context(), identity)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		profile.DeletionEnabled = s.cfg.Supabase.ServiceRoleKey != ""
		writeJSON(w, http.StatusOK, profile)
	case http.MethodPut:
		var update ProfileUpdateRequest
		if err := decodeJSONBody(r, &update); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		profile, err := s.store.SaveUserProfile(r.Context(), identity, update)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		profile.DeletionEnabled = s.cfg.Supabase.ServiceRoleKey != ""
		writeJSON(w, http.StatusOK, profile)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *Server) handleMySongs(w http.ResponseWriter, r *http.Request, identity SupabaseIdentity) {
	switch r.Method {
	case http.MethodGet:
		songs, err := s.store.ListUserSongs(r.Context(), identity.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, songs)
	case http.MethodPost:
		var payload SongPayload
		if err := decodeJSONBody(r, &payload); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		song, err := s.store.CreateSong(r.Context(), identity, payload)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		writeJSON(w, http.StatusCreated, song)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *Server) handleMySongByID(w http.ResponseWriter, r *http.Request, identity SupabaseIdentity) {
	songID := strings.TrimSpace(strings.TrimPrefix(r.URL.Path, "/api/me/songs/"))
	if songID == "" {
		writeError(w, http.StatusNotFound, "song not found")
		return
	}

	if r.Method != http.MethodPut {
		writeMethodNotAllowed(w)
		return
	}

	var payload SongPayload
	if err := decodeJSONBody(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	song, err := s.store.UpdateSong(r.Context(), identity, songID, payload)
	if err != nil {
		switch {
		case errors.Is(err, errNotFound):
			writeError(w, http.StatusNotFound, "song not found")
		case errors.Is(err, errForbidden):
			writeError(w, http.StatusForbidden, "only the publishing owner can update this song")
		default:
			writeError(w, http.StatusBadRequest, err.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, song)
}

func (s *Server) handleDeleteAccount(w http.ResponseWriter, r *http.Request, identity SupabaseIdentity) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}

	if s.cfg.Supabase.ServiceRoleKey == "" {
		writeError(w, http.StatusNotImplemented, "self-serve account deletion needs supabase.service_role_key in api/config.yaml")
		return
	}

	if err := s.deleteSupabaseUser(r.Context(), identity.ID); err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	if err := s.store.SoftDeleteProfile(r.Context(), identity.ID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"deleted": true,
	})
}

func (s *Server) requireAuth(next func(http.ResponseWriter, *http.Request, SupabaseIdentity)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		identity, err := s.authenticateRequest(r)
		if err != nil {
			writeError(w, http.StatusUnauthorized, err.Error())
			return
		}
		next(w, r, identity)
	}
}

func (s *Server) optionalIdentity(r *http.Request) (*SupabaseIdentity, error) {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if authHeader == "" {
		return nil, nil
	}
	identity, err := s.authenticateRequest(r)
	if err != nil {
		return nil, err
	}
	return &identity, nil
}

func (s *Server) authenticateRequest(r *http.Request) (SupabaseIdentity, error) {
	authHeader := strings.TrimSpace(r.Header.Get("Authorization"))
	if authHeader == "" {
		return SupabaseIdentity{}, errors.New("missing bearer token")
	}
	if !strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
		return SupabaseIdentity{}, errors.New("invalid authorization header")
	}
	token := strings.TrimSpace(authHeader[7:])
	if token == "" {
		return SupabaseIdentity{}, errors.New("missing bearer token")
	}
	return s.fetchSupabaseIdentity(r.Context(), token)
}

func (s *Server) fetchSupabaseIdentity(ctx context.Context, accessToken string) (SupabaseIdentity, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, s.cfg.Supabase.URL+"/auth/v1/user", nil)
	if err != nil {
		return SupabaseIdentity{}, fmt.Errorf("build supabase auth request: %w", err)
	}
	req.Header.Set("apikey", s.cfg.Supabase.PublishableKey)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return SupabaseIdentity{}, fmt.Errorf("contact supabase auth: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return SupabaseIdentity{}, fmt.Errorf("supabase auth rejected the session")
	}

	var payload struct {
		ID           string                 `json:"id"`
		Email        string                 `json:"email"`
		UserMetadata map[string]interface{} `json:"user_metadata"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return SupabaseIdentity{}, fmt.Errorf("decode supabase user: %w", err)
	}
	if strings.TrimSpace(payload.ID) == "" {
		return SupabaseIdentity{}, fmt.Errorf("supabase user response was missing an id")
	}

	displayName := metadataString(payload.UserMetadata, "full_name")
	if displayName == "" {
		displayName = metadataString(payload.UserMetadata, "name")
	}
	return SupabaseIdentity{
		ID:          payload.ID,
		Email:       strings.TrimSpace(payload.Email),
		DisplayName: displayName,
	}, nil
}

func metadataString(values map[string]interface{}, key string) string {
	if values == nil {
		return ""
	}
	raw, ok := values[key]
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

func (s *Server) deleteSupabaseUser(ctx context.Context, userID string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, s.cfg.Supabase.URL+"/auth/v1/admin/users/"+userID, bytes.NewReader([]byte(`{"should_soft_delete":true}`)))
	if err != nil {
		return fmt.Errorf("build delete user request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.cfg.Supabase.ServiceRoleKey)
	req.Header.Set("Authorization", "Bearer "+s.cfg.Supabase.ServiceRoleKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("contact supabase admin API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	return fmt.Errorf("supabase delete user failed: %s", strings.TrimSpace(string(body)))
}

func decodeJSONBody(r *http.Request, dst interface{}) error {
	defer r.Body.Close()
	decoder := json.NewDecoder(io.LimitReader(r.Body, 2<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dst); err != nil {
		return fmt.Errorf("invalid JSON body: %w", err)
	}
	return nil
}

func writeJSON(w http.ResponseWriter, status int, value interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeMethodNotAllowed(w http.ResponseWriter) {
	writeError(w, http.StatusMethodNotAllowed, "method not allowed")
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, apiError{Error: message})
}
