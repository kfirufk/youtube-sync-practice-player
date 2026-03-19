package main

import (
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strings"
	"time"
)

var (
	slugCleaner     = regexp.MustCompile(`[^a-z0-9]+`)
	hexColorMatcher = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
)

type BootstrapResponse struct {
	Site             SiteBootstrap   `json:"site"`
	Supabase         SupabasePublic  `json:"supabase"`
	Features         FeatureFlags    `json:"features"`
	DefaultSettings  ProfileSettings `json:"defaultSettings"`
}

type SiteBootstrap struct {
	Name         string `json:"name"`
	Domain       string `json:"domain"`
	BaseURL      string `json:"baseUrl"`
	ContactEmail string `json:"contactEmail"`
	PrivacyURL   string `json:"privacyUrl"`
	TermsURL     string `json:"termsUrl"`
	CookiesURL   string `json:"cookiesUrl"`
	LicenseURL   string `json:"licenseUrl"`
}

type SupabasePublic struct {
	URL            string `json:"url"`
	PublishableKey string `json:"publishableKey"`
}

type FeatureFlags struct {
	AccountDeletionEnabled bool `json:"accountDeletionEnabled"`
}

type SupabaseIdentity struct {
	ID          string
	Email       string
	DisplayName string
}

type UserProfile struct {
	UserID            string          `json:"userId"`
	Email             string          `json:"email"`
	DisplayName       string          `json:"displayName"`
	Settings          ProfileSettings `json:"settings"`
	DeletionEnabled   bool            `json:"deletionEnabled"`
	DeletedAt         *time.Time      `json:"deletedAt,omitempty"`
}

type ProfileUpdateRequest struct {
	DisplayName string          `json:"displayName"`
	Settings    ProfileSettings `json:"settings"`
}

type ProfileSettings struct {
	ThemeMode                  string           `json:"themeMode"`
	AutoEnterPracticeOnPlay    bool             `json:"autoEnterPracticeOnPlay"`
	ShowPracticeShortcutLegend bool             `json:"showPracticeShortcutLegend"`
	MarkerRetargetThresholdSec float64          `json:"markerRetargetThresholdSec"`
	Shortcuts                  ShortcutSettings `json:"shortcuts"`
}

type ShortcutSettings struct {
	PlayPause            string `json:"playPause"`
	Restart              string `json:"restart"`
	Mute                 string `json:"mute"`
	LyricsFocus          string `json:"lyricsFocus"`
	PracticeMode         string `json:"practiceMode"`
	MetronomeToggle      string `json:"metronomeToggle"`
	ToggleShortcutLegend string `json:"toggleShortcutLegend"`
	CaptureMarker        string `json:"captureMarker"`
}

type Song struct {
	ID                   string    `json:"id"`
	Slug                 string    `json:"slug"`
	Title                string    `json:"title"`
	Artist               string    `json:"artist"`
	Summary              string    `json:"summary"`
	Description          string    `json:"description"`
	OwnerUserID          string    `json:"ownerUserId,omitempty"`
	OwnerDisplayName     string    `json:"ownerDisplayName"`
	OfficialClipURL      string    `json:"officialClipUrl"`
	TutorialURL          string    `json:"tutorialUrl"`
	SongStartSec         float64   `json:"songStartSec"`
	TutorialStartSec     float64   `json:"tutorialStartSec"`
	CountdownSec         int       `json:"countdownSec"`
	MetronomeBPM         int       `json:"metronomeBpm"`
	MetronomeBeatsPerBar int       `json:"metronomeBeatsPerBar"`
	LoopRepeatTarget     int       `json:"loopRepeatTarget"`
	Lyrics               string    `json:"lyrics"`
	Markers              []Marker  `json:"markers"`
	Sections             []Section `json:"sections"`
	Published            bool      `json:"published"`
	CreatedAt            time.Time `json:"createdAt"`
	UpdatedAt            time.Time `json:"updatedAt"`
	CanEdit              bool      `json:"canEdit"`
}

type SongCard struct {
	ID               string    `json:"id"`
	Slug             string    `json:"slug"`
	Title            string    `json:"title"`
	Artist           string    `json:"artist"`
	Summary          string    `json:"summary"`
	Description      string    `json:"description"`
	OwnerDisplayName string    `json:"ownerDisplayName"`
	OfficialClipURL  string    `json:"officialClipUrl"`
	TutorialURL      string    `json:"tutorialUrl"`
	MarkerCount      int       `json:"markerCount"`
	SectionCount     int       `json:"sectionCount"`
	Published        bool      `json:"published"`
	UpdatedAt        time.Time `json:"updatedAt"`
	CanEdit          bool      `json:"canEdit"`
}

type SongPayload struct {
	Title                string    `json:"title"`
	Artist               string    `json:"artist"`
	Summary              string    `json:"summary"`
	Description          string    `json:"description"`
	OfficialClipURL      string    `json:"officialClipUrl"`
	TutorialURL          string    `json:"tutorialUrl"`
	SongStartSec         float64   `json:"songStartSec"`
	TutorialStartSec     float64   `json:"tutorialStartSec"`
	CountdownSec         int       `json:"countdownSec"`
	MetronomeBPM         int       `json:"metronomeBpm"`
	MetronomeBeatsPerBar int       `json:"metronomeBeatsPerBar"`
	LoopRepeatTarget     int       `json:"loopRepeatTarget"`
	Lyrics               string    `json:"lyrics"`
	Markers              []Marker  `json:"markers"`
	Sections             []Section `json:"sections"`
	Published            bool      `json:"published"`
}

type Marker struct {
	ID            string  `json:"id"`
	Label         string  `json:"label"`
	MasterTimeSec float64 `json:"masterTimeSec"`
}

type Section struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Color       string   `json:"color"`
	StartSec    float64  `json:"startSec"`
	EndSec      *float64 `json:"endSec"`
	RepeatCount int      `json:"repeatCount"`
	Shortcut    string   `json:"shortcut"`
}

type apiError struct {
	Error string `json:"error"`
}

func defaultProfileSettings() ProfileSettings {
	return ProfileSettings{
		ThemeMode:                  "system",
		AutoEnterPracticeOnPlay:    true,
		ShowPracticeShortcutLegend: true,
		MarkerRetargetThresholdSec: 5,
		Shortcuts: ShortcutSettings{
			PlayPause:            "Space",
			Restart:              "R",
			Mute:                 "M",
			LyricsFocus:          "L",
			PracticeMode:         "F",
			MetronomeToggle:      "T",
			ToggleShortcutLegend: "H",
			CaptureMarker:        "Q",
		},
	}
}

func normalizeProfileSettings(settings ProfileSettings) ProfileSettings {
	defaults := defaultProfileSettings()

	switch settings.ThemeMode {
	case "system", "dark", "light":
	default:
		settings.ThemeMode = defaults.ThemeMode
	}

	if settings.MarkerRetargetThresholdSec <= 0 {
		settings.MarkerRetargetThresholdSec = defaults.MarkerRetargetThresholdSec
	}
	if settings.MarkerRetargetThresholdSec > 30 {
		settings.MarkerRetargetThresholdSec = 30
	}

	settings.Shortcuts.PlayPause = normalizeShortcut(settings.Shortcuts.PlayPause, defaults.Shortcuts.PlayPause)
	settings.Shortcuts.Restart = normalizeShortcut(settings.Shortcuts.Restart, defaults.Shortcuts.Restart)
	settings.Shortcuts.Mute = normalizeShortcut(settings.Shortcuts.Mute, defaults.Shortcuts.Mute)
	settings.Shortcuts.LyricsFocus = normalizeShortcut(settings.Shortcuts.LyricsFocus, defaults.Shortcuts.LyricsFocus)
	settings.Shortcuts.PracticeMode = normalizeShortcut(settings.Shortcuts.PracticeMode, defaults.Shortcuts.PracticeMode)
	settings.Shortcuts.MetronomeToggle = normalizeShortcut(settings.Shortcuts.MetronomeToggle, defaults.Shortcuts.MetronomeToggle)
	settings.Shortcuts.ToggleShortcutLegend = normalizeShortcut(settings.Shortcuts.ToggleShortcutLegend, defaults.Shortcuts.ToggleShortcutLegend)
	settings.Shortcuts.CaptureMarker = normalizeShortcut(settings.Shortcuts.CaptureMarker, defaults.Shortcuts.CaptureMarker)

	return settings
}

func normalizeShortcut(raw string, fallback string) string {
	value := strings.TrimSpace(raw)
	if value == "" {
		return fallback
	}
	if strings.EqualFold(value, "space") {
		return "Space"
	}
	if len([]rune(value)) == 1 {
		return strings.ToUpper(value)
	}
	return value
}

func normalizeSongPayload(payload SongPayload) (SongPayload, error) {
	payload.Title = strings.TrimSpace(payload.Title)
	payload.Artist = strings.TrimSpace(payload.Artist)
	payload.Summary = strings.TrimSpace(payload.Summary)
	payload.Description = strings.TrimSpace(payload.Description)
	payload.OfficialClipURL = strings.TrimSpace(payload.OfficialClipURL)
	payload.TutorialURL = strings.TrimSpace(payload.TutorialURL)
	payload.Lyrics = strings.TrimSpace(payload.Lyrics)

	if payload.Title == "" {
		return payload, fmt.Errorf("title is required")
	}
	if payload.Artist == "" {
		return payload, fmt.Errorf("artist is required")
	}
	if payload.OfficialClipURL == "" {
		return payload, fmt.Errorf("official clip URL is required")
	}
	if payload.TutorialURL == "" {
		return payload, fmt.Errorf("tutorial URL is required")
	}
	if payload.Summary == "" {
		payload.Summary = fmt.Sprintf("%s practice sync", payload.Title)
	}

	payload.SongStartSec = round3(maxFloat(0, payload.SongStartSec))
	payload.TutorialStartSec = round3(maxFloat(0, payload.TutorialStartSec))
	payload.CountdownSec = clampInt(payload.CountdownSec, 0, 8)
	payload.MetronomeBPM = clampInt(payload.MetronomeBPM, 30, 300)
	payload.MetronomeBeatsPerBar = clampInt(payload.MetronomeBeatsPerBar, 1, 12)
	payload.LoopRepeatTarget = clampInt(payload.LoopRepeatTarget, 0, 999)

	payload.Markers = normalizeMarkers(payload.Markers)
	payload.Sections = normalizeSections(payload.Sections)

	return payload, nil
}

func normalizeMarkers(markers []Marker) []Marker {
	out := make([]Marker, 0, len(markers))
	for idx, marker := range markers {
		label := strings.TrimSpace(marker.Label)
		if label == "" {
			label = fmt.Sprintf("Label %d", idx+1)
		}
		id := strings.TrimSpace(marker.ID)
		if id == "" {
			id = fmt.Sprintf("marker-%d", idx+1)
		}
		out = append(out, Marker{
			ID:            id,
			Label:         label,
			MasterTimeSec: round3(maxFloat(0, marker.MasterTimeSec)),
		})
	}

	sort.Slice(out, func(i, j int) bool {
		if out[i].MasterTimeSec == out[j].MasterTimeSec {
			return out[i].Label < out[j].Label
		}
		return out[i].MasterTimeSec < out[j].MasterTimeSec
	})
	return out
}

func normalizeSections(sections []Section) []Section {
	out := make([]Section, 0, len(sections))
	seenShortcuts := map[string]bool{}

	for idx, section := range sections {
		name := strings.TrimSpace(section.Name)
		if name == "" {
			name = fmt.Sprintf("Section %d", idx+1)
		}

		id := strings.TrimSpace(section.ID)
		if id == "" {
			id = fmt.Sprintf("section-%d", idx+1)
		}

		color := strings.TrimSpace(section.Color)
		if !hexColorMatcher.MatchString(color) {
			color = "#4f8cff"
		}

		start := round3(maxFloat(0, section.StartSec))
		var end *float64
		if section.EndSec != nil {
			safeEnd := round3(maxFloat(0, *section.EndSec))
			if safeEnd > start {
				end = &safeEnd
			}
		}

		shortcut := normalizeShortcut(section.Shortcut, "")
		if shortcut != "" {
			if seenShortcuts[shortcut] {
				shortcut = ""
			} else {
				seenShortcuts[shortcut] = true
			}
		}

		out = append(out, Section{
			ID:          id,
			Name:        name,
			Color:       color,
			StartSec:    start,
			EndSec:      end,
			RepeatCount: clampInt(section.RepeatCount, 0, 999),
			Shortcut:    shortcut,
		})
	}

	sort.Slice(out, func(i, j int) bool {
		if out[i].StartSec == out[j].StartSec {
			return out[i].Name < out[j].Name
		}
		return out[i].StartSec < out[j].StartSec
	})
	return out
}

func decodeProfileSettings(raw []byte) ProfileSettings {
	settings := defaultProfileSettings()
	if len(raw) == 0 {
		return settings
	}
	if err := json.Unmarshal(raw, &settings); err != nil {
		return defaultProfileSettings()
	}
	return normalizeProfileSettings(settings)
}

func encodeJSON(value any) []byte {
	raw, err := json.Marshal(value)
	if err != nil {
		return []byte("null")
	}
	return raw
}

func slugify(parts ...string) string {
	joined := strings.ToLower(strings.TrimSpace(strings.Join(parts, " ")))
	joined = slugCleaner.ReplaceAllString(joined, "-")
	joined = strings.Trim(joined, "-")
	if joined == "" {
		return "song"
	}
	return joined
}

func ownerDisplayName(identity SupabaseIdentity) string {
	if strings.TrimSpace(identity.DisplayName) != "" {
		return strings.TrimSpace(identity.DisplayName)
	}
	email := strings.TrimSpace(identity.Email)
	if email == "" {
		return "Creator"
	}
	if idx := strings.Index(email, "@"); idx > 0 {
		return email[:idx]
	}
	return email
}

func round3(value float64) float64 {
	return math.Round(value*1000) / 1000
}

func maxFloat(a float64, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

func clampInt(value int, minValue int, maxValue int) int {
	if value < minValue {
		return minValue
	}
	if value > maxValue {
		return maxValue
	}
	return value
}
