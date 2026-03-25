package main

import (
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

	"github.com/resend/resend-go/v3"
)

type Server struct {
	cfg         Config
	store       *Store
	clientDir   string
	projectRoot string
	httpClient  *http.Client
	resend      *resend.Client
	authLimiter *authRateLimiter
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

	var resendClient *resend.Client
	if strings.TrimSpace(cfg.Resend.APIKey) != "" {
		resendClient = resend.NewClient(cfg.Resend.APIKey)
	}

	server := &Server{
		cfg:         cfg,
		store:       store,
		clientDir:   clientDir,
		projectRoot: projectRoot,
		httpClient: &http.Client{
			Timeout: 12 * time.Second,
		},
		resend:      resendClient,
		authLimiter: newAuthRateLimiter(),
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
	apiMux.HandleFunc("/api/auth/session", s.handleAuthSession)
	apiMux.HandleFunc("/api/auth/email", s.handleStartEmailAuth)
	apiMux.HandleFunc("/api/auth/google", s.handleGoogleAuth)
	apiMux.HandleFunc("/api/auth/logout", s.handleLogout)
	apiMux.HandleFunc("/api/songs", s.handleSongs)
	apiMux.HandleFunc("/api/songs/", s.handleSongByID)
	apiMux.HandleFunc("/api/me/profile", s.requireAuth(s.handleProfile))
	apiMux.HandleFunc("/api/me/songs", s.requireAuth(s.handleMySongs))
	apiMux.HandleFunc("/api/me/songs/", s.requireAuth(s.handleMySongByID))
	apiMux.HandleFunc("/api/me/account/delete", s.requireAuth(s.handleDeleteAccount))

	rootMux := http.NewServeMux()
	rootMux.Handle("/api/", apiMux)
	rootMux.HandleFunc("/auth/email/verify", s.handleEmailAuthCallback)
	rootMux.HandleFunc("/", s.handleStatic)

	return s.withSecurityHeaders(s.withRequestGuards(rootMux))
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
	connectSrc := "connect-src 'self' https://www.youtube.com https://www.googleapis.com https://accounts.google.com"
	csp := strings.Join([]string{
		"default-src 'self'",
		"script-src 'self' https://www.youtube.com https://s.ytimg.com https://accounts.google.com",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: https://i.ytimg.com https://img.youtube.com https://lh3.googleusercontent.com",
		"frame-src https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com",
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
		Auth: AuthBootstrap{
			EmailEnabled:   s.emailAuthEnabled(),
			GoogleEnabled:  s.googleAuthEnabled(),
			GoogleClientID: s.cfg.Google.ClientID,
		},
		Features: FeatureFlags{
			AccountDeletionEnabled: true,
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

func (s *Server) handleProfile(w http.ResponseWriter, r *http.Request, identity UserIdentity) {
	switch r.Method {
	case http.MethodGet:
		profile, err := s.store.EnsureUserProfile(r.Context(), identity)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		profile.DeletionEnabled = true
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
		profile.DeletionEnabled = true
		writeJSON(w, http.StatusOK, profile)
	default:
		writeMethodNotAllowed(w)
	}
}

func (s *Server) handleMySongs(w http.ResponseWriter, r *http.Request, identity UserIdentity) {
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

func (s *Server) handleMySongByID(w http.ResponseWriter, r *http.Request, identity UserIdentity) {
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

func (s *Server) handleDeleteAccount(w http.ResponseWriter, r *http.Request, identity UserIdentity) {
	if r.Method != http.MethodPost {
		writeMethodNotAllowed(w)
		return
	}

	var payload DeleteAccountRequest
	if err := decodeJSONBody(r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if strings.TrimSpace(payload.Confirmation) != "DELETE MY ACCOUNT" {
		writeError(w, http.StatusBadRequest, "confirmation text must be DELETE MY ACCOUNT")
		return
	}

	if err := s.store.RevokeAllSessionsForUser(r.Context(), identity.ID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if err := s.store.SoftDeleteProfile(r.Context(), identity.ID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.clearSessionCookie(w)
	writeJSON(w, http.StatusOK, map[string]any{
		"deleted": true,
	})
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
