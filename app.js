/* global YT */

const el = (id) => document.getElementById(id);

const PLAY_ICON_PATH = "M8 5v14l11-7z";
const PAUSE_ICON_PATH = "M6 5h4v14H6zm8 0h4v14h-4z";
const MUTE_ICON_PATH = "M5 9v6h4l5 5V4L9 9Zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4";
const UNMUTE_ICON_PATH = "M5 9v6h4l5 5V4L9 9Zm9.6 3 2.4 2.4 1.4-1.4-2.4-2.4 2.4-2.4-1.4-1.4-2.4 2.4-2.4-2.4-1.4 1.4 2.4 2.4-2.4 2.4 1.4 1.4z";
const MARKER_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const THEME_MODES = ["system", "dark", "light"];
const THEME_STORAGE_KEY = "practice-player-theme-mode";

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
  const safe = Math.max(0, Number(sec) || 0);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseLRC(text) {
  const lines = [];
  const re = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]\s*(.*)/g;
  for (const row of text.split(/\r?\n/)) {
    let m;
    let matched = false;
    while ((m = re.exec(row)) !== null) {
      matched = true;
      const mm = Number.parseInt(m[1], 10);
      const ss = Number.parseInt(m[2], 10);
      const cs = m[3] ? Number.parseInt(m[3].padEnd(2, "0"), 10) : 0;
      const t = mm * 60 + ss + cs / 100;
      const content = (m[4] || "").trim();
      if (content) lines.push({ t, content });
    }
    if (!matched && row.trim()) {
      lines.push({ t: null, content: row.trim() });
    }
    re.lastIndex = 0;
  }

  if (lines.some((x) => x.t != null)) {
    return lines.filter((x) => x.t != null).sort((a, b) => a.t - b.t);
  }
  return lines.map((x) => ({ t: null, content: x.content }));
}

function ensureNumber(value, fallback = 0) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// --- State ---
let songPlayer;
let pianoPlayer;
let readySong = false;
let readyPiano = false;
let isSyncing = false;
let userScrubbing = false;
let duration = 0;
let songStartSec = 0;
let pianoStartSec = 0;
let syncTimer = null;
let lastPianoCorrectionAt = 0;
let countdownTimer = null;
let ytApiPromise = null;
let prefersSchemeMql = null;

let lyrics = [];
let lastActiveIdx = -1;

const state = {
  songs: [],
  markers: []
};

// --- UI ---
const loadBtn = el("loadBtn");
const playBtn = el("playBtn");
const restartBtn = el("restartBtn");
const mutePianoBtn = el("mutePianoBtn");
const scrubber = el("scrubber");
const timeLabel = el("timeLabel");
const lyricsBox = el("lyricsBox");
const presetSelect = el("presetSelect");
const presetStatus = el("presetStatus");
const toggleConfigBtn = el("toggleConfigBtn");
const configPanel = el("configPanel");
const playIconPath = el("playIconPath");
const muteIconPath = el("muteIconPath");
const countdownOverlay = el("countdownOverlay");
const countdownValue = el("countdownValue");
const shortcutsBtn = el("shortcutsBtn");
const themeBtn = el("themeBtn");
const shortcutsModal = el("shortcutsModal");
const closeShortcutsBtn = el("closeShortcutsBtn");
const shortcutsList = el("shortcutsList");
const lyricsFocusBtn = el("lyricsFocusBtn");

const markerName = el("markerName");
const markerKey = el("markerKey");
const markerSource = el("markerSource");
const markerTime = el("markerTime");
const useCurrentMarkerBtn = el("useCurrentMarkerBtn");
const addMarkerBtn = el("addMarkerBtn");
const markersList = el("markersList");

function setPresetStatus(text) {
  presetStatus.textContent = text || "";
}

function getSystemThemeSafe() {
  try {
    if (window.matchMedia) {
      const isLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      return isLight ? "light" : "dark";
    }
  } catch {
    // Ignore and use dark fallback.
  }
  return "dark";
}

function resolveTheme(mode) {
  if (mode === "light" || mode === "dark") return mode;
  return getSystemThemeSafe();
}

function updateThemeButtonLabel(mode, resolvedTheme) {
  const mapping = {
    system: "Auto",
    dark: "Dark",
    light: "Light"
  };
  themeBtn.textContent = `Theme: ${mapping[mode] || "Auto"}`;
  themeBtn.title = `Theme mode (${mapping[mode] || "Auto"}, active: ${resolvedTheme})`;
}

function applyTheme(mode, persist = true) {
  const safeMode = THEME_MODES.includes(mode) ? mode : "system";
  const resolvedTheme = resolveTheme(safeMode);
  document.body.dataset.themeMode = safeMode;
  document.body.dataset.theme = resolvedTheme;
  updateThemeButtonLabel(safeMode, resolvedTheme);

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, safeMode);
    } catch {
      // Ignore storage failures.
    }
  }
}

function nextThemeMode(currentMode) {
  const idx = THEME_MODES.indexOf(currentMode);
  const nextIdx = idx === -1 ? 0 : (idx + 1) % THEME_MODES.length;
  return THEME_MODES[nextIdx];
}

function initTheme() {
  let savedMode = "system";
  try {
    const fromStorage = localStorage.getItem(THEME_STORAGE_KEY);
    if (THEME_MODES.includes(fromStorage)) savedMode = fromStorage;
  } catch {
    savedMode = "system";
  }

  applyTheme(savedMode, false);

  if (window.matchMedia) {
    prefersSchemeMql = window.matchMedia("(prefers-color-scheme: light)");
    const onSystemChange = () => {
      if (document.body.dataset.themeMode === "system") {
        applyTheme("system", false);
      }
    };
    if (typeof prefersSchemeMql.addEventListener === "function") {
      prefersSchemeMql.addEventListener("change", onSystemChange);
    } else if (typeof prefersSchemeMql.addListener === "function") {
      prefersSchemeMql.addListener(onSystemChange);
    }
  }
}

function setConfigCollapsed(collapsed) {
  configPanel.classList.toggle("is-collapsed", collapsed);
  toggleConfigBtn.classList.toggle("is-collapsed", collapsed);
  toggleConfigBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
  toggleConfigBtn.setAttribute("title", collapsed ? "Expand setup" : "Collapse setup");
}

function setSyncing(value) {
  isSyncing = value;
  playIconPath.setAttribute("d", value ? PAUSE_ICON_PATH : PLAY_ICON_PATH);
  if (value) startSyncLoop();
  else stopSyncLoop();
}

function updateMuteIcon() {
  if (!pianoPlayer || !pianoPlayer.isMuted) {
    muteIconPath.setAttribute("d", MUTE_ICON_PATH);
    return;
  }
  muteIconPath.setAttribute("d", pianoPlayer.isMuted() ? UNMUTE_ICON_PATH : MUTE_ICON_PATH);
}

function populateMarkerKeys() {
  markerKey.innerHTML = "";
  for (const key of MARKER_KEYS) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = key;
    markerKey.appendChild(opt);
  }
}

function renderLyrics() {
  lyricsBox.innerHTML = "";
  if (!lyrics.length) {
    lyricsBox.innerHTML = '<div class="small">No lyrics loaded yet. Paste lyrics and click "Use pasted lyrics".</div>';
    return;
  }

  lyrics.forEach((line, idx) => {
    const div = document.createElement("div");
    div.className = "line";
    div.dataset.idx = String(idx);
    div.textContent = (line.t != null ? `[${fmtTime(line.t)}] ` : "") + line.content;
    lyricsBox.appendChild(div);
  });

  lastActiveIdx = -1;
}

function setActiveLyricByTime(t) {
  if (!lyrics.length || lyrics[0].t == null) return;

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

  if (ans < 0) ans = 0;
  if (ans === lastActiveIdx) return;

  const prev = lyricsBox.querySelector(".line.active");
  if (prev) prev.classList.remove("active");

  const curr = lyricsBox.querySelector(`.line[data-idx="${ans}"]`);
  if (curr) {
    curr.classList.add("active");
    curr.scrollIntoView({ block: "center", behavior: "auto" });
  }
  lastActiveIdx = ans;
}

function markerToMasterTime(marker) {
  const raw = Math.max(0, ensureNumber(marker.timeSec, 0));
  if (marker.source === "piano") return Math.max(0, raw - pianoStartSec);
  return Math.max(0, raw - songStartSec);
}

function masterToSourceTime(source, master) {
  const safeMaster = Math.max(0, ensureNumber(master, 0));
  if (source === "piano") return safeMaster + pianoStartSec;
  return safeMaster + songStartSec;
}

function normalizeMarker(raw) {
  if (!raw) return null;
  const key = String(raw.key ?? "").trim();
  if (!MARKER_KEYS.includes(key)) return null;

  const sourceRaw = String(raw.source || "song").toLowerCase();
  const source = sourceRaw === "piano" || sourceRaw === "tutorial" ? "piano" : "song";
  const timeSec = Math.max(0, ensureNumber(raw.timeSec ?? raw.time ?? 0, 0));
  const fallbackName = source === "piano" ? `Tutorial ${key}` : `Clip ${key}`;
  const name = String(raw.name || fallbackName).trim() || fallbackName;
  return { key, source, timeSec, name };
}

function sortMarkers() {
  state.markers.sort((a, b) => Number(a.key) - Number(b.key));
}

function upsertMarker(marker) {
  const idx = state.markers.findIndex((m) => m.key === marker.key);
  if (idx >= 0) state.markers[idx] = marker;
  else state.markers.push(marker);
  sortMarkers();
  renderMarkersList();
  renderShortcutsList();
}

function renderMarkersList() {
  markersList.innerHTML = "";

  if (!state.markers.length) {
    markersList.textContent = "No labels yet.";
    return;
  }

  for (const marker of state.markers) {
    const row = document.createElement("div");
    row.className = "markerRow";

    const meta = document.createElement("div");
    meta.className = "markerMeta";
    const sourceLabel = marker.source === "piano" ? "tutorial" : "official";
    meta.textContent = `[${marker.key}] ${marker.name} (${sourceLabel} ${fmtTime(marker.timeSec)})`;

    const actions = document.createElement("div");
    actions.className = "markerActions";

    const jumpBtn = document.createElement("button");
    jumpBtn.type = "button";
    jumpBtn.textContent = "Jump";
    jumpBtn.addEventListener("click", () => jumpToMarkerKey(marker.key));

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      markerName.value = marker.name;
      markerKey.value = marker.key;
      markerSource.value = marker.source;
      markerTime.value = String(round2(marker.timeSec));
    });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      state.markers = state.markers.filter((m) => m.key !== marker.key);
      renderMarkersList();
      renderShortcutsList();
    });

    actions.append(jumpBtn, editBtn, delBtn);
    row.append(meta, actions);
    markersList.appendChild(row);
  }
}

function renderShortcutsList() {
  const rows = [
    { key: "Space / K", action: "Play or pause" },
    { key: "R", action: "Back to start" },
    { key: "M", action: "Mute/unmute tutorial" },
    { key: "Left / Right", action: "Seek -5 / +5 seconds" },
    { key: "L", action: "Toggle lyrics focus" },
    { key: "?", action: "Open or close this shortcuts panel" }
  ];

  const markerText = state.markers.length
    ? state.markers.map((m) => `${m.key} -> ${m.name}`).join(" | ")
    : "No labels yet";
  rows.push({ key: "1-9", action: `Jump to timeline labels (${markerText})` });

  shortcutsList.innerHTML = "";
  for (const row of rows) {
    const div = document.createElement("div");
    div.className = "shortcutRow";
    const left = document.createElement("strong");
    left.textContent = row.key;
    const right = document.createElement("span");
    right.textContent = row.action;
    div.append(left, right);
    shortcutsList.appendChild(div);
  }
}

function openShortcuts() {
  renderShortcutsList();
  shortcutsModal.classList.remove("hidden");
}

function closeShortcuts() {
  shortcutsModal.classList.add("hidden");
}

function clampMasterTime(t) {
  const safe = Math.max(0, ensureNumber(t, 0));
  if (duration > 0) return Math.min(duration, safe);
  return safe;
}

function getMasterTime() {
  if (!songPlayer || !songPlayer.getCurrentTime) return 0;
  return Math.max(0, (songPlayer.getCurrentTime() || 0) - songStartSec);
}

function canSync() {
  return Boolean(readySong && readyPiano && songPlayer && pianoPlayer);
}

function setTransportTime(masterTime) {
  const t = clampMasterTime(masterTime);
  scrubber.value = String(t);
  timeLabel.textContent = `${fmtTime(t)} / ${fmtTime(duration)}`;
}

function safeSeekBoth(masterTime, seekAhead = true) {
  if (!canSync()) return;
  const t = clampMasterTime(masterTime);
  const songTime = t + songStartSec;
  const pianoTime = t + pianoStartSec;

  songPlayer.seekTo(songTime, seekAhead);
  pianoPlayer.seekTo(pianoTime, seekAhead);
  setTransportTime(t);
  setActiveLyricByTime(t);
}

function disableTransport() {
  playBtn.disabled = true;
  restartBtn.disabled = true;
  mutePianoBtn.disabled = true;
  scrubber.disabled = true;
}

function enableTransport() {
  playBtn.disabled = false;
  restartBtn.disabled = false;
  mutePianoBtn.disabled = false;
  scrubber.disabled = false;
}

function stopSyncLoop() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

function startSyncLoop() {
  stopSyncLoop();
  syncTimer = setInterval(() => {
    if (!canSync() || !isSyncing || userScrubbing) return;

    const master = clampMasterTime(getMasterTime());
    const targetPiano = master + pianoStartSec;
    const currentPiano = ensureNumber(pianoPlayer.getCurrentTime?.(), targetPiano);
    const drift = currentPiano - targetPiano;

    if (Math.abs(drift) > 0.45 && Date.now() - lastPianoCorrectionAt > 500) {
      pianoPlayer.seekTo(Math.max(0, targetPiano), true);
      lastPianoCorrectionAt = Date.now();
    }

    setTransportTime(master);
    setActiveLyricByTime(master);

    if (duration > 0 && master >= duration) {
      songPlayer.pauseVideo();
      pianoPlayer.pauseVideo();
      setSyncing(false);
    }
  }, 100);
}

function cancelCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  countdownOverlay.classList.add("hidden");
}

function startPlaybackNow() {
  if (!canSync()) return;
  const t = userScrubbing ? ensureNumber(scrubber.value, 0) : getMasterTime();
  safeSeekBoth(t);
  songPlayer.playVideo();
  pianoPlayer.playVideo();
  setSyncing(true);
}

function startPlaybackWithCountdown() {
  if (!canSync()) return;

  const count = Math.max(0, Math.floor(ensureNumber(el("countdownSec").value, 0)));
  if (count <= 0) {
    startPlaybackNow();
    return;
  }

  cancelCountdown();
  let left = count;
  countdownValue.textContent = String(left);
  countdownOverlay.classList.remove("hidden");

  countdownTimer = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      cancelCountdown();
      startPlaybackNow();
      return;
    }
    countdownValue.textContent = String(left);
  }, 1000);
}

function togglePlayPause() {
  if (!canSync()) return;
  const playing = songPlayer.getPlayerState?.() === 1 || pianoPlayer.getPlayerState?.() === 1;

  if (playing || isSyncing) {
    cancelCountdown();
    songPlayer.pauseVideo();
    pianoPlayer.pauseVideo();
    setSyncing(false);
    return;
  }

  startPlaybackWithCountdown();
}

function restart() {
  if (!canSync()) return;
  cancelCountdown();
  songPlayer.pauseVideo();
  pianoPlayer.pauseVideo();
  setSyncing(false);
  userScrubbing = false;
  safeSeekBoth(0);
}

function toggleMutePiano() {
  if (!pianoPlayer || !pianoPlayer.isMuted) return;
  if (pianoPlayer.isMuted()) pianoPlayer.unMute();
  else pianoPlayer.mute();
  updateMuteIcon();
}

function jumpToMarkerKey(key) {
  const marker = state.markers.find((m) => m.key === key);
  if (!marker || !canSync()) return;

  cancelCountdown();
  songPlayer.pauseVideo();
  pianoPlayer.pauseVideo();
  setSyncing(false);
  safeSeekBoth(markerToMasterTime(marker));
}

function readOffsets() {
  songStartSec = Math.max(0, ensureNumber(el("songOffset").value, 0));
  pianoStartSec = Math.max(0, ensureNumber(el("pianoOffset").value, 0));
}

function setMarkerTimeFromCurrent() {
  const source = markerSource.value === "piano" ? "piano" : "song";
  const master = canSync() ? getMasterTime() : ensureNumber(scrubber.value, 0);
  markerTime.value = String(round2(masterToSourceTime(source, master)));
}

function addOrUpdateMarkerFromForm() {
  const raw = normalizeMarker({
    key: markerKey.value,
    source: markerSource.value,
    timeSec: ensureNumber(markerTime.value, 0),
    name: markerName.value.trim()
  });

  if (!raw) {
    alert("Invalid label. Set key 1-9 and a valid time.");
    return;
  }

  upsertMarker(raw);
}

function usePastedLyrics() {
  const text = el("lyricsPaste").value.trim();
  lyrics = text ? parseLRC(text) : [];
  renderLyrics();
  if (canSync()) setActiveLyricByTime(getMasterTime());
}

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
  el("pianoUrl").value = song.pianoUrl || song.tutorialUrl || "";
  el("songOffset").value = String(ensureNumber(song.songStartSec, 0));
  el("pianoOffset").value = String(ensureNumber(song.pianoStartSec, 0));
  el("countdownSec").value = String(Math.max(0, Math.floor(ensureNumber(song.countdownSec, 4))));

  const rawLyrics = String(song.lyrics || "");
  el("lyricsPaste").value = rawLyrics;
  lyrics = rawLyrics ? parseLRC(rawLyrics) : [];
  renderLyrics();

  const markers = Array.isArray(song.markers)
    ? song.markers.map(normalizeMarker).filter(Boolean)
    : [];
  state.markers = markers;
  sortMarkers();
  renderMarkersList();
  renderShortcutsList();
}

function exportCurrentPreset() {
  const obj = {
    name: el("presetName").value.trim() || "Untitled preset",
    songUrl: el("songUrl").value.trim(),
    pianoUrl: el("pianoUrl").value.trim(),
    songStartSec: ensureNumber(el("songOffset").value, 0),
    pianoStartSec: ensureNumber(el("pianoOffset").value, 0),
    countdownSec: Math.max(0, Math.floor(ensureNumber(el("countdownSec").value, 0))),
    lyrics: el("lyricsPaste").value.trim(),
    markers: state.markers.map((m) => ({
      key: m.key,
      name: m.name,
      source: m.source,
      timeSec: round2(m.timeSec)
    }))
  };

  el("exportOutput").value = JSON.stringify(obj, null, 2);
}

async function loadSongs() {
  try {
    const res = await fetch("songs.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`songs.json load failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("songs.json must be an array");
    state.songs = data;
    setPresetStatus(`Loaded ${data.length} preset(s).`);
  } catch (err) {
    console.warn(err);
    state.songs = [];
    setPresetStatus("Could not load songs.json. Run from a local server.");
  }

  renderPresetSelect();
  if (state.songs.length) {
    presetSelect.value = "0";
    applyPreset(state.songs[0]);
  }
}

function onPlayerStateChange(evt) {
  if (!canSync()) return;

  const stateCode = evt?.data;
  if (stateCode === YT.PlayerState.PLAYING && !isSyncing) {
    setSyncing(true);
    return;
  }

  if (stateCode === YT.PlayerState.PAUSED || stateCode === YT.PlayerState.ENDED) {
    const songState = songPlayer.getPlayerState?.();
    const pianoState = pianoPlayer.getPlayerState?.();
    const eitherPlaying = songState === YT.PlayerState.PLAYING || pianoState === YT.PlayerState.PLAYING;
    if (!eitherPlaying && isSyncing) {
      setSyncing(false);
    }
  }
}

function ensureYTApi() {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => resolve();
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

async function loadPlayers() {
  readOffsets();

  const pianoId = extractYouTubeId(el("pianoUrl").value);
  const songId = extractYouTubeId(el("songUrl").value);

  if (!pianoId || !songId) {
    alert("Could not parse one of the YouTube URLs.");
    return;
  }

  await ensureYTApi();

  cancelCountdown();
  setSyncing(false);
  disableTransport();
  readySong = false;
  readyPiano = false;
  duration = 0;

  if (songPlayer?.destroy) songPlayer.destroy();
  if (pianoPlayer?.destroy) pianoPlayer.destroy();

  const onBothReady = () => {
    if (!readySong || !readyPiano) return;

    duration = Math.max(0, (songPlayer.getDuration?.() || 0) - songStartSec);
    scrubber.min = "0";
    scrubber.max = String(duration || 100);

    songPlayer.cueVideoById({ videoId: songId, startSeconds: songStartSec, suggestedQuality: "large" });
    pianoPlayer.cueVideoById({ videoId: pianoId, startSeconds: pianoStartSec, suggestedQuality: "large" });

    setTimeout(() => {
      safeSeekBoth(0, true);
      enableTransport();
      updateMuteIcon();
      setTransportTime(0);
      setActiveLyricByTime(0);
    }, 220);
  };

  pianoPlayer = new YT.Player("pianoPlayer", {
    width: "100%",
    height: "100%",
    videoId: pianoId,
    playerVars: {
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      disablekb: 1
    },
    events: {
      onReady: () => {
        readyPiano = true;
        pianoPlayer.mute();
        updateMuteIcon();
        onBothReady();
      },
      onStateChange: onPlayerStateChange
    }
  });

  songPlayer = new YT.Player("songPlayer", {
    width: "100%",
    height: "100%",
    videoId: songId,
    playerVars: {
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      disablekb: 1
    },
    events: {
      onReady: () => {
        readySong = true;
        onBothReady();
      },
      onStateChange: onPlayerStateChange
    }
  });
}

// --- Events ---
loadBtn.addEventListener("click", loadPlayers);
playBtn.addEventListener("click", togglePlayPause);
restartBtn.addEventListener("click", restart);
mutePianoBtn.addEventListener("click", toggleMutePiano);

el("usePastedBtn").addEventListener("click", usePastedLyrics);
el("exportPresetBtn").addEventListener("click", exportCurrentPreset);

el("applyPresetBtn").addEventListener("click", () => {
  const idx = Number.parseInt(presetSelect.value, 10);
  if (Number.isFinite(idx) && state.songs[idx]) {
    applyPreset(state.songs[idx]);
  }
});

toggleConfigBtn.addEventListener("click", () => {
  const collapsed = !configPanel.classList.contains("is-collapsed");
  setConfigCollapsed(collapsed);
});

scrubber.addEventListener("input", () => {
  userScrubbing = true;
  const t = ensureNumber(scrubber.value, 0);
  setTransportTime(t);
  setActiveLyricByTime(t);
});

scrubber.addEventListener("change", () => {
  if (!canSync()) return;
  const t = ensureNumber(scrubber.value, 0);
  safeSeekBoth(t);
  userScrubbing = false;
});

scrubber.addEventListener("mouseup", () => {
  userScrubbing = false;
});

scrubber.addEventListener("touchend", () => {
  userScrubbing = false;
});

shortcutsBtn.addEventListener("click", openShortcuts);
themeBtn.addEventListener("click", () => {
  const currentMode = document.body.dataset.themeMode || "system";
  applyTheme(nextThemeMode(currentMode), true);
});
closeShortcutsBtn.addEventListener("click", closeShortcuts);
shortcutsModal.addEventListener("click", (evt) => {
  if (evt.target === shortcutsModal) closeShortcuts();
});

lyricsFocusBtn.addEventListener("click", () => {
  document.body.classList.toggle("lyrics-focus");
});

useCurrentMarkerBtn.addEventListener("click", setMarkerTimeFromCurrent);
addMarkerBtn.addEventListener("click", addOrUpdateMarkerFromForm);

window.addEventListener("keydown", (e) => {
  const key = e.key;
  const activeTag = document.activeElement?.tagName;
  const typing = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";

  if (key === "?" && !typing) {
    e.preventDefault();
    if (shortcutsModal.classList.contains("hidden")) openShortcuts();
    else closeShortcuts();
    return;
  }

  if (key === "Escape" && !shortcutsModal.classList.contains("hidden")) {
    closeShortcuts();
    return;
  }

  if (typing) return;

  if (e.code === "Space" || key.toLowerCase() === "k") {
    e.preventDefault();
    togglePlayPause();
    return;
  }

  if (key.toLowerCase() === "r") {
    restart();
    return;
  }

  if (key.toLowerCase() === "m") {
    toggleMutePiano();
    return;
  }

  if (key.toLowerCase() === "l") {
    document.body.classList.toggle("lyrics-focus");
    return;
  }

  if (key === "0" && canSync()) {
    cancelCountdown();
    songPlayer.pauseVideo();
    pianoPlayer.pauseVideo();
    setSyncing(false);
    safeSeekBoth(0);
    return;
  }

  if (key === "ArrowLeft" && canSync()) {
    const t = clampMasterTime(getMasterTime() - 5);
    safeSeekBoth(t);
    return;
  }

  if (key === "ArrowRight" && canSync()) {
    const t = clampMasterTime(getMasterTime() + 5);
    safeSeekBoth(t);
    return;
  }

  if (MARKER_KEYS.includes(key)) {
    jumpToMarkerKey(key);
  }
});

// --- Init ---
populateMarkerKeys();
initTheme();
setConfigCollapsed(false);
disableTransport();
renderLyrics();
renderMarkersList();
renderShortcutsList();
updateMuteIcon();
loadSongs();
