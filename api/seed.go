package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type legacySongSeed struct {
	Name                string             `json:"name"`
	SongURL             string             `json:"songUrl"`
	PianoURL            string             `json:"pianoUrl"`
	SongStartSec        float64            `json:"songStartSec"`
	PianoStartSec       float64            `json:"pianoStartSec"`
	CountdownSec        int                `json:"countdownSec"`
	MetronomeBPM        int                `json:"metronomeBpm"`
	MetronomeBeatsPerBar int               `json:"metronomeBeatsPerBar"`
	LoopRepeatTarget    int                `json:"loopRepeatTarget"`
	Lyrics              string             `json:"lyrics"`
	Markers             []legacyMarkerSeed `json:"markers"`
	Sections            []Section          `json:"sections"`
}

type legacyMarkerSeed struct {
	Key     string  `json:"key"`
	Name    string  `json:"name"`
	Source  string  `json:"source"`
	TimeSec float64 `json:"timeSec"`
}

const devSeedOwnerUserID = "b38f9272-ed74-4fd5-ac7f-aa0ca47427aa"

func BootstrapLegacySeeds(ctx context.Context, store *Store, rootDir string) error {
	var exists bool
	if err := store.pool.QueryRow(ctx, `select exists(select 1 from songs where slug = $1)`, "rihanna-stay-practice").Scan(&exists); err != nil {
		return fmt.Errorf("check legacy seed: %w", err)
	}
	if exists {
		return nil
	}

	raw, err := os.ReadFile(filepath.Join(rootDir, "songs.json"))
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("read legacy songs.json: %w", err)
	}

	var songs []legacySongSeed
	if err := json.Unmarshal(raw, &songs); err != nil {
		return fmt.Errorf("parse legacy songs.json: %w", err)
	}
	if len(songs) == 0 {
		return nil
	}

	first := songs[0]
	countdown := first.CountdownSec
	if countdown <= 0 {
		countdown = 4
	}
	bpm := first.MetronomeBPM
	if bpm <= 0 {
		bpm = 92
	}
	beatsPerBar := first.MetronomeBeatsPerBar
	if beatsPerBar <= 0 {
		beatsPerBar = 4
	}
	loopRepeatTarget := first.LoopRepeatTarget
	if loopRepeatTarget < 0 {
		loopRepeatTarget = 4
	}

	payload := SongPayload{
		Title:                "Stay",
		Artist:               "Rihanna",
		Summary:              strings.TrimSpace(first.Name),
		Description:          "Imported from the legacy inline preset into PostgreSQL.",
		OfficialClipURL:      strings.TrimSpace(first.SongURL),
		TutorialURL:          strings.TrimSpace(first.PianoURL),
		SongStartSec:         first.SongStartSec,
		TutorialStartSec:     first.PianoStartSec,
		CountdownSec:         countdown,
		MetronomeBPM:         bpm,
		MetronomeBeatsPerBar: beatsPerBar,
		LoopRepeatTarget:     loopRepeatTarget,
		Lyrics:               first.Lyrics,
		Markers:              convertLegacyMarkers(first.Markers, first.SongStartSec, first.PianoStartSec),
		Sections:             normalizeSections(first.Sections),
		Published:            true,
	}

	if err := store.InsertSeedSong(ctx, "rihanna-stay-practice", payload, "sync.tvguitar.com"); err != nil {
		return fmt.Errorf("insert legacy seed: %w", err)
	}
	return nil
}

func convertLegacyMarkers(markers []legacyMarkerSeed, songOffset float64, pianoOffset float64) []Marker {
	out := make([]Marker, 0, len(markers))
	for idx, marker := range markers {
		label := strings.TrimSpace(marker.Name)
		if label == "" {
			label = fmt.Sprintf("Label %d", idx+1)
		}

		masterTime := marker.TimeSec - songOffset
		source := strings.ToLower(strings.TrimSpace(marker.Source))
		if source == "piano" || source == "tutorial" {
			masterTime = marker.TimeSec - pianoOffset
		}
		if masterTime < 0 {
			masterTime = 0
		}

		out = append(out, Marker{
			ID:            fmt.Sprintf("seed-marker-%d", idx+1),
			Label:         label,
			MasterTimeSec: round3(masterTime),
		})
	}
	return normalizeMarkers(out)
}
