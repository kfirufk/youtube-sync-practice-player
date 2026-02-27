/* global YT */

const el = (id) => document.getElementById(id);

// --- Helpers ---
function extractYouTubeId(url) {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
}

function fmtTime(sec) {
  const safe = Math.max(0, sec || 0);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// Parse LRC: [mm:ss.xx] text
function parseLRC(text) {
  const lines = [];
  const re = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]\s*(.*)/g;
  const raw = text.split(/\r?\n/);
  for (const row of raw) {
    let m;
    let matched = false;
    while ((m = re.exec(row)) !== null) {
      matched = true;
      const mm = parseInt(m[1], 10);
      const ss = parseInt(m[2], 10);
      const cs = m[3] ? parseInt(m[3].padEnd(2, "0"), 10) : 0;
      const t = mm * 60 + ss + cs / 100;
      const content = (m[4] || "").trim();
      lines.push({ t, content });
    }
    if (!matched && row.trim()) {
      lines.push({ t: null, content: row.trim() });
    }
    re.lastIndex = 0;
  }

  const hasTimed = lines.some((x) => x.t !== null);
  if (hasTimed) return lines.filter((x) => x.t !== null && x.content).sort((a, b) => a.t - b.t);
  return lines.filter((x) => x.content).map((x, i) => ({ t: null, content: x.content, i }));
}

function ensureNumber(value, fallback = 0) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

// --- State ---
let songPlayer;
let pianoPlayer;
let readySong = false;
let readyPiano = false;
let syncing = false;
let userScrubbing = false;
let songStartSec = 0;
let pianoStartSec = 0;
let duration = 0;

let lyrics = [];
let lastActiveIdx = -1;

const state = {
  songs: []
};

// --- UI elements ---
const loadBtn = el("loadBtn");
const playBtn = el("playBtn");
const restartBtn = el("restartBtn");
const mutePianoBtn = el("mutePianoBtn");
const scrubber = el("scrubber");
const timeLabel = el("timeLabel");
const lyricsBox = el("lyricsBox");
const presetSelect = el("presetSelect");
const presetStatus = el("presetStatus");

function setPresetStatus(text) {
  presetStatus.textContent = text || "";
}

function setSyncing(isSyncing) {
  syncing = isSyncing;
  document.body.classList.toggle("is-playing", isSyncing);
}

function renderLyrics() {
  lyricsBox.innerHTML = "";
  if (!lyrics.length) {
    lyricsBox.innerHTML = "<div class=\"small\">No lyrics loaded. Fetch from LRCLIB or paste your own.</div>";
    return;
  }
  lyrics.forEach((l, idx) => {
    const div = document.createElement("div");
    div.className = "line";
    div.dataset.idx = String(idx);
    div.textContent = (l.t != null ? `[${fmtTime(l.t)}] ` : "") + l.content;
    lyricsBox.appendChild(div);
  });
  lastActiveIdx = -1;
}

function setActiveLyricByTime(t) {
  if (!lyrics.length) return;
  if (lyrics[0].t == null) return;

  let lo = 0;
  let hi = lyrics.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lyrics[mid].t <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (ans === -1) ans = 0;
  if (ans === lastActiveIdx) return;

  const prev = lyricsBox.querySelector(".line.active");
  if (prev) prev.classList.remove("active");

  const curr = lyricsBox.querySelector(`.line[data-idx=\"${ans}\"]`);
  if (curr) {
    curr.classList.add("active");
    curr.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  lastActiveIdx = ans;
}

// --- YouTube API boot ---
function ensureYTApi() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => resolve();
    document.head.appendChild(tag);
  });
}

function canSync() {
  return readySong && readyPiano;
}

function enableControls() {
  playBtn.disabled = false;
  restartBtn.disabled = false;
  mutePianoBtn.disabled = false;
  scrubber.disabled = false;
}

function readOffsets() {
  pianoStartSec = Math.max(0, ensureNumber(el("pianoOffset").value, 0));
  songStartSec = Math.max(0, ensureNumber(el("songOffset").value, 0));
}

function safeSeekBoth(masterTime) {
  const maxTime = duration || masterTime;
  const t = Math.max(0, Math.min(maxTime, masterTime));
  const songTime = t + songStartSec;
  const pianoTime = t + pianoStartSec;

  songPlayer.seekTo(songTime, true);
  pianoPlayer.seekTo(pianoTime, true);
}

function syncLoop() {
  if (!canSync() || !syncing || userScrubbing) return;

  const songTime = songPlayer.getCurrentTime() - songStartSec;
  const t = Math.max(0, songTime);
  const targetPiano = t + pianoStartSec;
  const pianoTime = pianoPlayer.getCurrentTime();

  const drift = pianoTime - targetPiano;
  if (Math.abs(drift) > 0.25) {
    pianoPlayer.seekTo(Math.max(0, targetPiano), true);
  }

  if (duration > 0) {
    scrubber.value = String(Math.max(0, Math.min(duration, t)));
  }
  timeLabel.textContent = `${fmtTime(t)} / ${fmtTime(duration)}`;
  setActiveLyricByTime(t);

  requestAnimationFrame(syncLoop);
}

function isPlayingAny() {
  return (songPlayer.getPlayerState && songPlayer.getPlayerState() === 1) ||
    (pianoPlayer.getPlayerState && pianoPlayer.getPlayerState() === 1);
}

function togglePlayPause() {
  if (!canSync()) return;
  const t = Math.max(0, songPlayer.getCurrentTime() - songStartSec);

  safeSeekBoth(t);

  if (isPlayingAny()) {
    songPlayer.pauseVideo();
    pianoPlayer.pauseVideo();
    setSyncing(false);
  } else {
    songPlayer.playVideo();
    pianoPlayer.playVideo();
    setSyncing(true);
    requestAnimationFrame(syncLoop);
  }
}

function restart() {
  if (!canSync()) return;
  songPlayer.pauseVideo();
  pianoPlayer.pauseVideo();
  safeSeekBoth(0);
  setSyncing(false);
  scrubber.value = "0";
  timeLabel.textContent = `${fmtTime(0)} / ${fmtTime(duration)}`;
  setActiveLyricByTime(0);
}

function toggleMutePiano() {
  if (!pianoPlayer) return;
  if (pianoPlayer.isMuted()) pianoPlayer.unMute();
  else pianoPlayer.mute();
  mutePianoBtn.textContent = pianoPlayer.isMuted() ? "Unmute Piano (M)" : "Mute Piano (M)";
}

async function loadPlayers() {
  readOffsets();

  const pianoId = extractYouTubeId(el("pianoUrl").value);
  const songId = extractYouTubeId(el("songUrl").value);

  if (!pianoId || !songId) {
    alert("Could not parse one of the YouTube URLs (missing video id).");
    return;
  }

  await ensureYTApi();

  readySong = false;
  readyPiano = false;
  setSyncing(false);
  scrubber.disabled = true;
  playBtn.disabled = true;
  restartBtn.disabled = true;
  mutePianoBtn.disabled = true;

  if (pianoPlayer && pianoPlayer.destroy) pianoPlayer.destroy();
  if (songPlayer && songPlayer.destroy) songPlayer.destroy();

  pianoPlayer = new YT.Player("pianoPlayer", {
    videoId: pianoId,
    playerVars: { playsinline: 1, modestbranding: 1, rel: 0 },
    events: {
      onReady: () => {
        readyPiano = true;
        pianoPlayer.mute();
        mutePianoBtn.textContent = "Unmute Piano (M)";
        if (canSync()) onBothReady();
      }
    }
  });

  songPlayer = new YT.Player("songPlayer", {
    videoId: songId,
    playerVars: { playsinline: 1, modestbranding: 1, rel: 0 },
    events: {
      onReady: () => {
        readySong = true;
        if (canSync()) onBothReady();
      }
    }
  });

  function onBothReady() {
    duration = Math.max(0, (songPlayer.getDuration?.() || 0) - songStartSec);
    scrubber.max = String(duration || 100);
    enableControls();

    safeSeekBoth(0);
    timeLabel.textContent = `${fmtTime(0)} / ${fmtTime(duration)}`;
    setActiveLyricByTime(0);
  }
}

// --- Lyrics fetch (LRCLIB) ---
async function fetchLyricsLRCLIB() {
  const artist = el("artist").value.trim();
  const title = el("title").value.trim();
  if (!artist || !title) return alert("Enter Artist + Title first.");

  try {
    const qs = new URLSearchParams({ q: `${artist} ${title}` });
    const searchUrl = `https://lrclib.net/api/search?${qs.toString()}`;
    const r = await fetch(searchUrl);
    if (!r.ok) throw new Error(`Search failed: ${r.status}`);
    const arr = await r.json();
    if (!Array.isArray(arr) || arr.length === 0) throw new Error("No results in LRCLIB.");

    const best = arr[0];
    if (!best || !best.id) throw new Error("LRCLIB result missing id.");

    const getUrl = `https://lrclib.net/api/get?id=${encodeURIComponent(best.id)}`;
    const r2 = await fetch(getUrl);
    if (!r2.ok) throw new Error(`Get failed: ${r2.status}`);
    const rec = await r2.json();

    const text = (rec.syncedLyrics || rec.synced_lyrics || rec.plainLyrics || rec.plain_lyrics || "").trim();
    if (!text) throw new Error("No lyrics text returned.");
    el("lyricsPaste").value = text;

    lyrics = parseLRC(text);
    renderLyrics();
    if (canSync()) setActiveLyricByTime(Math.max(0, songPlayer.getCurrentTime() - songStartSec));
  } catch (err) {
    console.warn(err);
    alert("LRCLIB fetch failed (or blocked). Paste lyrics manually in the box and click Use pasted.");
  }
}

function usePastedLyrics() {
  const text = el("lyricsPaste").value.trim();
  if (!text) return alert("Paste some lyrics first.");
  lyrics = parseLRC(text);
  renderLyrics();
}

// --- Presets ---
function renderPresetSelect() {
  presetSelect.innerHTML = "";
  if (!state.songs.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No presets loaded";
    presetSelect.appendChild(opt);
    return;
  }

  state.songs.forEach((song, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx);
    opt.textContent = song.name || `Preset ${idx + 1}`;
    presetSelect.appendChild(opt);
  });
}

function applyPreset(song) {
  if (!song) return;
  el("presetName").value = song.name || "";
  el("songUrl").value = song.songUrl || "";
  el("pianoUrl").value = song.pianoUrl || "";
  el("songOffset").value = String(ensureNumber(song.songStartSec, 0));
  el("pianoOffset").value = String(ensureNumber(song.pianoStartSec, 0));
  el("artist").value = song.artist || "";
  el("title").value = song.title || "";

  if (song.lyrics) {
    el("lyricsPaste").value = song.lyrics;
    lyrics = parseLRC(song.lyrics);
  } else {
    el("lyricsPaste").value = "";
    lyrics = [];
  }
  renderLyrics();
}

function exportCurrentPreset() {
  const obj = {
    name: el("presetName").value.trim() || "Untitled preset",
    songUrl: el("songUrl").value.trim(),
    pianoUrl: el("pianoUrl").value.trim(),
    songStartSec: ensureNumber(el("songOffset").value, 0),
    pianoStartSec: ensureNumber(el("pianoOffset").value, 0),
    artist: el("artist").value.trim(),
    title: el("title").value.trim(),
    lyrics: el("lyricsPaste").value.trim()
  };

  el("exportOutput").value = JSON.stringify(obj, null, 2);
}

async function loadSongs() {
  try {
    const res = await fetch("songs.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`songs.json load failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("songs.json must be an array.");
    state.songs = data;
    setPresetStatus(`Loaded ${data.length} preset(s).`);
  } catch (err) {
    console.warn(err);
    state.songs = [];
    setPresetStatus("Could not load songs.json. If you opened index.html directly from disk, use a local server.");
  }

  renderPresetSelect();
  if (state.songs.length) {
    presetSelect.value = "0";
    applyPreset(state.songs[0]);
  }
}

// --- Events ---
loadBtn.addEventListener("click", loadPlayers);
playBtn.addEventListener("click", togglePlayPause);
restartBtn.addEventListener("click", restart);
mutePianoBtn.addEventListener("click", toggleMutePiano);

el("fetchLyricsBtn").addEventListener("click", fetchLyricsLRCLIB);
el("usePastedBtn").addEventListener("click", usePastedLyrics);

el("applyPresetBtn").addEventListener("click", () => {
  const idx = Number.parseInt(presetSelect.value, 10);
  if (Number.isFinite(idx) && state.songs[idx]) {
    applyPreset(state.songs[idx]);
  }
});

el("exportPresetBtn").addEventListener("click", exportCurrentPreset);

scrubber.addEventListener("input", () => {
  if (!canSync()) return;
  userScrubbing = true;
  const t = ensureNumber(scrubber.value, 0);
  timeLabel.textContent = `${fmtTime(t)} / ${fmtTime(duration)}`;
  setActiveLyricByTime(t);
});

scrubber.addEventListener("change", () => {
  if (!canSync()) return;
  const t = ensureNumber(scrubber.value, 0);
  safeSeekBoth(t);
  userScrubbing = false;
  if (isPlayingAny()) {
    songPlayer.playVideo();
    pianoPlayer.playVideo();
    setSyncing(true);
    requestAnimationFrame(syncLoop);
  }
});

window.addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

  if (e.code === "Space") {
    e.preventDefault();
    togglePlayPause();
  } else if (e.key.toLowerCase() === "r") {
    restart();
  } else if (e.key.toLowerCase() === "m") {
    toggleMutePiano();
  } else if (e.key === "0") {
    safeSeekBoth(0);
  } else if (e.key === "ArrowLeft") {
    if (!canSync()) return;
    const t = Math.max(0, (songPlayer.getCurrentTime() - songStartSec) - 5);
    safeSeekBoth(t);
  } else if (e.key === "ArrowRight") {
    if (!canSync()) return;
    const t = Math.min(duration, (songPlayer.getCurrentTime() - songStartSec) + 5);
    safeSeekBoth(t);
  }
});

// init
renderLyrics();
loadSongs();
