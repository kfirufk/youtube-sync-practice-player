# Practice Sync Player

A fast two-video practice player for guitar, piano, or vocals.

Load:
- one **tutorial** video (muted/unmuted on demand)
- one **official clip** video

Then control both with a single timeline so you can practice difficult sections repeatedly.

Built with vanilla HTML/CSS/JavaScript and YouTube IFrame API.

## Why this exists
When practicing an instrument, you often need:
- tutorial fingering + original song feel
- exact timeline sync with custom offsets
- jump points for tricky sections
- lyrics visible while playing

This app is focused on that workflow.

## Features
- Single master timeline controlling both videos in sync
- Configurable offsets (`songStartSec`, `pianoStartSec`)
- One-click offset calibration from current frames
- Manual lyrics (plain text or LRC timestamps)
- Timeline labels with keyboard shortcuts (`1`-`9`)
- Section manager (ranges) with optional section shortcuts
- Start-from-here practice (`start -> end` supported)
- A/B loop training with repeat count (`0 = infinite`)
- Live metronome with BPM control
- Label source selection per marker (`song` or `piano` timeline)
- Configurable play countdown before playback starts
- Keyboard shortcuts modal (`?`)
- Shortcut remapping (saved locally)
- Autosave + recovery draft on reload
- Diagnostics panel (drift, corrections, buffering, loop cycles)
- Fullscreen practice mode with all-lyrics poster layout
- JSON preset export (copy into `songs.json`)
- Cleaner icon-based transport controls

## Keyboard shortcuts
- `Space` / `K`: play/pause
- `R`: back to start
- `M`: mute/unmute tutorial
- `Left` / `Right`: seek -5 / +5 sec
- `1`-`9`: jump to timeline labels
- `L`: lyrics focus mode
- `?`: open/close shortcuts panel

## Run locally
Use any local server. Example:

```bash
./start-server.sh
```

Then open:

```text
http://localhost:8000
```

If you open `index.html` directly from disk, `songs.json` loading may fail due to browser restrictions.

## Preset format (`songs.json`)
Each preset object can include:

```json
{
  "name": "Song - Practice",
  "songUrl": "https://www.youtube.com/watch?v=...",
  "pianoUrl": "https://www.youtube.com/watch?v=...",
  "songStartSec": 0,
  "pianoStartSec": 4.8,
  "countdownSec": 4,
  "metronomeBpm": 92,
  "loopRepeatTarget": 4,
  "lyrics": "...plain or LRC...",
  "markers": [
    { "key": "1", "name": "Intro", "source": "song", "timeSec": 42.3 },
    { "key": "2", "name": "Chorus", "source": "piano", "timeSec": 58.5 }
  ],
  "sections": [
    { "name": "Verse 1", "color": "#2f7cff", "startSec": 34, "endSec": 64, "repeatCount": 4, "shortcut": "Z" },
    { "name": "Solo", "color": "#eb5b2f", "startSec": 120, "endSec": null, "repeatCount": 0, "shortcut": "" }
  ]
}
```

Notes:
- `source: "song"` means `timeSec` is measured on the official clip timeline.
- `source: "piano"` means `timeSec` is measured on the tutorial timeline.
- `key` should be one of `"1"` to `"9"`.

## Tech
- Vanilla HTML/CSS/JavaScript
- YouTube IFrame API

## Credits
This project was iterated and improved with help from **ChatGPT Codex app**.

## License
MIT (see [LICENSE](LICENSE)).
