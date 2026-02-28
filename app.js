/* global YT */

const el = (id) => document.getElementById(id);

const PLAY_ICON_PATH = "M8 5v14l11-7z";
const PAUSE_ICON_PATH = "M6 5h4v14H6zm8 0h4v14h-4z";
const MUTE_ICON_PATH = "M5 9v6h4l5 5V4L9 9Zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4";
const UNMUTE_ICON_PATH = "M5 9v6h4l5 5V4L9 9Zm9.6 3 2.4 2.4 1.4-1.4-2.4-2.4 2.4-2.4-1.4-1.4-2.4 2.4-2.4-2.4-1.4 1.4 2.4 2.4-2.4 2.4 1.4 1.4z";
const MARKER_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const SECTION_SHORTCUT_KEYS = ["", "Z", "X", "C", "V", "B", "N", "J", "U", "I"];

const THEME_MODES = ["system", "dark", "light"];
const THEME_STORAGE_KEY = "practice-player-theme-mode";
const DRAFT_STORAGE_KEY = "practice-player-draft-v3";
const SHORTCUT_STORAGE_KEY = "practice-player-shortcuts-v1";

const DEFAULT_SHORTCUTS = {
  playPause: "Space",
  restart: "R",
  mute: "M",
  lyricsFocus: "L",
  practiceMode: "F",
  metronomeToggle: "T"
};

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

function genId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function safeLocalStorageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : raw;
  } catch {
    return fallback;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures.
  }
}

function normalizeShortcutValue(input, fallback) {
  const value = String(input || "").trim();
  if (!value) return fallback;
  if (value.toLowerCase() === "space") return "Space";
  if (value.length === 1) return value.toUpperCase();
  return value;
}

function keyMatchesShortcut(event, shortcut) {
  if (!shortcut) return false;
  if (shortcut === "Space") return event.code === "Space";
  if (shortcut.length === 1) return event.key.toUpperCase() === shortcut.toUpperCase();
  return event.key === shortcut || event.code === shortcut;
}

class MetronomeEngine {
  constructor() {
    this.enabled = false;
    this.bpm = 92;
    this.beatsPerBar = 4;
    this.timer = null;
    this.audioCtx = null;
    this.beatIndex = 0;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) this.stop();
  }

  setBpm(bpm) {
    this.bpm = clamp(Math.round(ensureNumber(bpm, 92)), 30, 300);
    if (this.timer) {
      this.stop();
      this.start();
    }
  }

  setBeatsPerBar(beats) {
    this.beatsPerBar = clamp(Math.round(ensureNumber(beats, 4)), 1, 12);
    this.beatIndex = 0;
  }

  ensureContext() {
    if (!this.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.audioCtx = new Ctx();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  click() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const accent = this.beatIndex % this.beatsPerBar === 0;

    osc.type = "square";
    osc.frequency.setValueAtTime(accent ? 1260 : 840, ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.085);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.095);

    this.beatIndex += 1;
  }

  start() {
    if (!this.enabled || this.timer) return;
    const interval = Math.max(50, 60000 / this.bpm);
    this.click();
    this.timer = setInterval(() => this.click(), interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  syncWithPlayback(isPlaying) {
    if (isPlaying && this.enabled) {
      this.start();
      return;
    }
    this.stop();
  }
}

const metronome = new MetronomeEngine();

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
let autosaveTimer = null;
let isPreparingPlayers = false;
let lastPlayRequestAt = 0;

let lyrics = [];
let lastActiveIdx = -1;

const appState = {
  songs: [],
  markers: [],
  sections: [],
  playWindowEnd: null,
  diagnostics: {
    driftMs: 0,
    corrections: 0,
    bufferingEvents: 0,
    loopCycles: 0
  },
  loop: {
    enabled: false,
    aSec: null,
    bSec: null,
    repeatTarget: 4,
    completed: 0
  },
  shortcuts: { ...DEFAULT_SHORTCUTS }
};

// --- UI ---
const loadBtn = el("loadBtn");
const calibrateBtn = el("calibrateBtn");
const calibrateStatus = el("calibrateStatus");
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
const practiceModeBtn = el("practiceModeBtn");

const markerName = el("markerName");
const markerKey = el("markerKey");
const markerSource = el("markerSource");
const markerTime = el("markerTime");
const useCurrentMarkerBtn = el("useCurrentMarkerBtn");
const addMarkerBtn = el("addMarkerBtn");
const markersList = el("markersList");

const sectionName = el("sectionName");
const sectionColor = el("sectionColor");
const sectionStart = el("sectionStart");
const sectionEnd = el("sectionEnd");
const sectionRepeat = el("sectionRepeat");
const sectionShortcut = el("sectionShortcut");
const useCurrentSectionStartBtn = el("useCurrentSectionStartBtn");
const useCurrentSectionEndBtn = el("useCurrentSectionEndBtn");
const addSectionBtn = el("addSectionBtn");
const sectionsList = el("sectionsList");

const toggleLoopBtn = el("toggleLoopBtn");
const setLoopABtn = el("setLoopABtn");
const setLoopBBtn = el("setLoopBBtn");
const clearLoopBtn = el("clearLoopBtn");
const loopRepeatsInput = el("loopRepeats");
const loopStatus = el("loopStatus");

const metronomeBpm = el("metronomeBpm");
const metronomeBeatsPerBar = el("metronomeBeatsPerBar");
const toggleMetronomeBtn = el("toggleMetronomeBtn");
const resyncBtn = el("resyncBtn");

const diagDrift = el("diagDrift");
const diagCorrections = el("diagCorrections");
const diagBuffering = el("diagBuffering");
const diagLoops = el("diagLoops");

const keyPlayPause = el("keyPlayPause");
const keyRestart = el("keyRestart");
const keyMute = el("keyMute");
const keyLyricsFocus = el("keyLyricsFocus");
const keyPracticeMode = el("keyPracticeMode");
const keyMetronomeToggle = el("keyMetronomeToggle");
const saveShortcutsBtn = el("saveShortcutsBtn");
const resetShortcutsBtn = el("resetShortcutsBtn");
const shortcutStatus = el("shortcutStatus");

function setPresetStatus(text) {
  presetStatus.textContent = text || "";
}

function setCalibrateStatus(text) {
  calibrateStatus.textContent = text || "";
}

function setShortcutStatus(text) {
  shortcutStatus.textContent = text || "";
}

function renderDiagnostics() {
  diagDrift.textContent = `${Math.round(appState.diagnostics.driftMs)} ms`;
  diagCorrections.textContent = String(appState.diagnostics.corrections);
  diagBuffering.textContent = String(appState.diagnostics.bufferingEvents);
  diagLoops.textContent = String(appState.diagnostics.loopCycles);
}

// --- Theme ---
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

  if (persist) safeLocalStorageSet(THEME_STORAGE_KEY, safeMode);
}

function nextThemeMode(currentMode) {
  const idx = THEME_MODES.indexOf(currentMode);
  const nextIdx = idx === -1 ? 0 : (idx + 1) % THEME_MODES.length;
  return THEME_MODES[nextIdx];
}

function initTheme() {
  let savedMode = "system";
  const fromStorage = safeLocalStorageGet(THEME_STORAGE_KEY, null);
  if (THEME_MODES.includes(fromStorage)) savedMode = fromStorage;

  applyTheme(savedMode, false);

  if (window.matchMedia) {
    prefersSchemeMql = window.matchMedia("(prefers-color-scheme: light)");
    const onSystemChange = () => {
      if (document.body.dataset.themeMode === "system") applyTheme("system", false);
    };
    if (typeof prefersSchemeMql.addEventListener === "function") {
      prefersSchemeMql.addEventListener("change", onSystemChange);
    } else if (typeof prefersSchemeMql.addListener === "function") {
      prefersSchemeMql.addListener(onSystemChange);
    }
  }
}

// --- General UI ---
function setConfigCollapsed(collapsed) {
  configPanel.classList.toggle("is-collapsed", collapsed);
  toggleConfigBtn.classList.toggle("is-collapsed", collapsed);
  toggleConfigBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
  toggleConfigBtn.setAttribute("title", collapsed ? "Expand setup" : "Collapse setup");
}

function setSyncing(value) {
  isSyncing = value;
  playIconPath.setAttribute("d", value ? PAUSE_ICON_PATH : PLAY_ICON_PATH);
  metronome.syncWithPlayback(value);
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

function togglePracticeMode() {
  const next = !document.body.classList.contains("practice-mode");
  document.body.classList.toggle("practice-mode", next);
  practiceModeBtn.textContent = next ? "Exit practice" : "Fullscreen practice";

  if (next) {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  } else if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }

  renderLyrics();
  if (canSync()) setActiveLyricByTime(getMasterTime());
}

function onFullscreenChange() {
  if (!document.fullscreenElement && document.body.classList.contains("practice-mode")) {
    document.body.classList.remove("practice-mode");
    practiceModeBtn.textContent = "Fullscreen practice";
    renderLyrics();
    if (canSync()) setActiveLyricByTime(getMasterTime());
  }
}

// --- Lyrics ---
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
    if (!document.body.classList.contains("practice-mode")) {
      curr.scrollIntoView({ block: "center", behavior: "auto" });
    }
  }
  lastActiveIdx = ans;
}

function usePastedLyrics() {
  const text = el("lyricsPaste").value.trim();
  lyrics = text ? parseLRC(text) : [];
  renderLyrics();
  if (canSync()) setActiveLyricByTime(getMasterTime());
  scheduleAutosave();
}

// --- Marker manager ---
function populateMarkerKeys() {
  markerKey.innerHTML = "";
  for (const key of MARKER_KEYS) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = key;
    markerKey.appendChild(opt);
  }
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
  appState.markers.sort((a, b) => Number(a.key) - Number(b.key));
}

function upsertMarker(marker) {
  const idx = appState.markers.findIndex((m) => m.key === marker.key);
  if (idx >= 0) appState.markers[idx] = marker;
  else appState.markers.push(marker);
  sortMarkers();
  renderMarkersList();
  renderShortcutsList();
  scheduleAutosave();
}

function renderMarkersList() {
  markersList.innerHTML = "";

  if (!appState.markers.length) {
    markersList.textContent = "No labels yet.";
    return;
  }

  for (const marker of appState.markers) {
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
      appState.markers = appState.markers.filter((m) => m.key !== marker.key);
      renderMarkersList();
      renderShortcutsList();
      scheduleAutosave();
    });

    actions.append(jumpBtn, editBtn, delBtn);
    row.append(meta, actions);
    markersList.appendChild(row);
  }
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

function jumpToMarkerKey(key) {
  const marker = appState.markers.find((m) => m.key === key);
  if (!marker || !canSync()) return;

  cancelCountdown();
  songPlayer.pauseVideo();
  pianoPlayer.pauseVideo();
  setSyncing(false);
  safeSeekBoth(markerToMasterTime(marker));
}

// --- Sections ---
function populateSectionShortcutOptions() {
  sectionShortcut.innerHTML = "";
  for (const key of SECTION_SHORTCUT_KEYS) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = key || "None";
    sectionShortcut.appendChild(opt);
  }
}

function normalizeSection(raw) {
  if (!raw) return null;
  const startSec = Math.max(0, ensureNumber(raw.startSec, 0));
  let endSec = raw.endSec === "" || raw.endSec == null ? null : Math.max(0, ensureNumber(raw.endSec, 0));
  if (endSec != null && endSec <= startSec) endSec = null;

  const repeatCount = Math.max(0, Math.floor(ensureNumber(raw.repeatCount, 0)));
  const name = String(raw.name || "").trim() || `Section ${appState.sections.length + 1}`;
  const color = String(raw.color || "#2f7cff");
  const shortcutRaw = String(raw.shortcut || "").toUpperCase();
  const shortcut = SECTION_SHORTCUT_KEYS.includes(shortcutRaw) ? shortcutRaw : "";

  return {
    id: raw.id || genId("section"),
    name,
    color,
    startSec,
    endSec,
    repeatCount,
    shortcut
  };
}

function upsertSection(section) {
  const idx = appState.sections.findIndex((s) => s.id === section.id);
  if (idx >= 0) appState.sections[idx] = section;
  else appState.sections.push(section);

  appState.sections.sort((a, b) => a.startSec - b.startSec);
  renderSectionsList();
  renderShortcutsList();
  scheduleAutosave();
}

function setSectionStartFromCurrent() {
  const master = canSync() ? getMasterTime() : ensureNumber(scrubber.value, 0);
  sectionStart.value = String(round2(master));
}

function setSectionEndFromCurrent() {
  const master = canSync() ? getMasterTime() : ensureNumber(scrubber.value, 0);
  sectionEnd.value = String(round2(master));
}

function addOrUpdateSectionFromForm() {
  const existingId = sectionName.dataset.editId || "";
  const section = normalizeSection({
    id: existingId || undefined,
    name: sectionName.value,
    color: sectionColor.value,
    startSec: sectionStart.value,
    endSec: sectionEnd.value,
    repeatCount: sectionRepeat.value,
    shortcut: sectionShortcut.value
  });

  if (!section) {
    alert("Invalid section values.");
    return;
  }

  if (section.shortcut) {
    for (const s of appState.sections) {
      if (s.shortcut === section.shortcut && s.id !== section.id) {
        s.shortcut = "";
      }
    }
  }

  upsertSection(section);
  sectionName.dataset.editId = "";
}

function renderSectionsList() {
  sectionsList.innerHTML = "";
  if (!appState.sections.length) {
    sectionsList.textContent = "No sections yet.";
    return;
  }

  for (const section of appState.sections) {
    const row = document.createElement("div");
    row.className = "markerRow";

    const meta = document.createElement("div");
    meta.className = "markerMeta";
    const chip = document.createElement("span");
    chip.className = "sectionChip";
    chip.style.background = section.color;

    const rangeLabel = section.endSec == null
      ? `${fmtTime(section.startSec)} -> end`
      : `${fmtTime(section.startSec)} -> ${fmtTime(section.endSec)}`;
    const repeatLabel = section.endSec == null ? "" : ` | loop:${section.repeatCount === 0 ? "inf" : section.repeatCount}`;
    const shortcutLabel = section.shortcut ? ` | ${section.shortcut}` : "";

    const text = document.createElement("span");
    text.textContent = `${section.name} (${rangeLabel}${repeatLabel}${shortcutLabel})`;
    meta.append(chip, text);

    const actions = document.createElement("div");
    actions.className = "markerActions";

    const jumpBtn = document.createElement("button");
    jumpBtn.type = "button";
    jumpBtn.textContent = "Jump";
    jumpBtn.addEventListener("click", () => {
      safeSeekBoth(section.startSec);
      appState.playWindowEnd = section.endSec == null ? null : section.endSec;
    });

    const playBtnEl = document.createElement("button");
    playBtnEl.type = "button";
    playBtnEl.textContent = "Play";
    playBtnEl.addEventListener("click", () => playSection(section, false));

    const loopBtn = document.createElement("button");
    loopBtn.type = "button";
    loopBtn.textContent = "Loop";
    loopBtn.disabled = section.endSec == null;
    loopBtn.addEventListener("click", () => playSection(section, true));

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      sectionName.value = section.name;
      sectionName.dataset.editId = section.id;
      sectionColor.value = section.color;
      sectionStart.value = String(round2(section.startSec));
      sectionEnd.value = section.endSec == null ? "" : String(round2(section.endSec));
      sectionRepeat.value = String(section.repeatCount);
      sectionShortcut.value = section.shortcut || "";
    });

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      appState.sections = appState.sections.filter((s) => s.id !== section.id);
      renderSectionsList();
      renderShortcutsList();
      scheduleAutosave();
    });

    actions.append(jumpBtn, playBtnEl, loopBtn, editBtn, delBtn);
    row.append(meta, actions);
    sectionsList.appendChild(row);
  }
}

function findSectionByShortcut(key) {
  const upper = key.toUpperCase();
  return appState.sections.find((s) => s.shortcut === upper);
}

function playSection(section, enableLoop) {
  if (!canSync()) return;

  cancelCountdown();
  songPlayer.pauseVideo();
  pianoPlayer.pauseVideo();
  setSyncing(false);

  safeSeekBoth(section.startSec);
  appState.playWindowEnd = section.endSec == null ? duration : section.endSec;

  if (enableLoop && section.endSec != null) {
    appState.loop.enabled = true;
    appState.loop.aSec = section.startSec;
    appState.loop.bSec = section.endSec;
    appState.loop.repeatTarget = section.repeatCount;
    appState.loop.completed = 0;
  } else {
    appState.loop.enabled = false;
    appState.loop.completed = 0;
  }

  renderLoopStatus();
  startPlaybackWithCountdown();
}

// --- Shortcuts ---
function loadShortcutInputsFromState() {
  keyPlayPause.value = appState.shortcuts.playPause;
  keyRestart.value = appState.shortcuts.restart;
  keyMute.value = appState.shortcuts.mute;
  keyLyricsFocus.value = appState.shortcuts.lyricsFocus;
  keyPracticeMode.value = appState.shortcuts.practiceMode;
  keyMetronomeToggle.value = appState.shortcuts.metronomeToggle;
}

function applyShortcutInputs() {
  appState.shortcuts = {
    playPause: normalizeShortcutValue(keyPlayPause.value, DEFAULT_SHORTCUTS.playPause),
    restart: normalizeShortcutValue(keyRestart.value, DEFAULT_SHORTCUTS.restart),
    mute: normalizeShortcutValue(keyMute.value, DEFAULT_SHORTCUTS.mute),
    lyricsFocus: normalizeShortcutValue(keyLyricsFocus.value, DEFAULT_SHORTCUTS.lyricsFocus),
    practiceMode: normalizeShortcutValue(keyPracticeMode.value, DEFAULT_SHORTCUTS.practiceMode),
    metronomeToggle: normalizeShortcutValue(keyMetronomeToggle.value, DEFAULT_SHORTCUTS.metronomeToggle)
  };

  loadShortcutInputsFromState();
  safeLocalStorageSet(SHORTCUT_STORAGE_KEY, JSON.stringify(appState.shortcuts));
  setShortcutStatus("Shortcuts saved.");
  renderShortcutsList();
  scheduleAutosave();
}

function resetShortcuts() {
  appState.shortcuts = { ...DEFAULT_SHORTCUTS };
  loadShortcutInputsFromState();
  safeLocalStorageSet(SHORTCUT_STORAGE_KEY, JSON.stringify(appState.shortcuts));
  setShortcutStatus("Shortcuts reset to defaults.");
  renderShortcutsList();
  scheduleAutosave();
}

function loadShortcutMap() {
  const raw = safeLocalStorageGet(SHORTCUT_STORAGE_KEY, null);
  if (!raw) {
    appState.shortcuts = { ...DEFAULT_SHORTCUTS };
    loadShortcutInputsFromState();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    appState.shortcuts = {
      playPause: normalizeShortcutValue(parsed.playPause, DEFAULT_SHORTCUTS.playPause),
      restart: normalizeShortcutValue(parsed.restart, DEFAULT_SHORTCUTS.restart),
      mute: normalizeShortcutValue(parsed.mute, DEFAULT_SHORTCUTS.mute),
      lyricsFocus: normalizeShortcutValue(parsed.lyricsFocus, DEFAULT_SHORTCUTS.lyricsFocus),
      practiceMode: normalizeShortcutValue(parsed.practiceMode, DEFAULT_SHORTCUTS.practiceMode),
      metronomeToggle: normalizeShortcutValue(parsed.metronomeToggle, DEFAULT_SHORTCUTS.metronomeToggle)
    };
  } catch {
    appState.shortcuts = { ...DEFAULT_SHORTCUTS };
  }

  loadShortcutInputsFromState();
}

function renderShortcutsList() {
  const rows = [
    { key: appState.shortcuts.playPause, action: "Play or pause" },
    { key: appState.shortcuts.restart, action: "Back to start" },
    { key: appState.shortcuts.mute, action: "Mute/unmute tutorial" },
    { key: "Left / Right", action: "Seek -5 / +5 seconds" },
    { key: appState.shortcuts.lyricsFocus, action: "Toggle lyrics focus" },
    { key: appState.shortcuts.practiceMode, action: "Toggle fullscreen practice" },
    { key: appState.shortcuts.metronomeToggle, action: "Toggle metronome" },
    { key: "?", action: "Open or close this shortcuts panel" }
  ];

  const markerText = appState.markers.length
    ? appState.markers.map((m) => `${m.key} -> ${m.name}`).join(" | ")
    : "No labels yet";
  rows.push({ key: "1-9", action: `Jump to timeline labels (${markerText})` });

  const sectionText = appState.sections.length
    ? appState.sections.filter((s) => s.shortcut).map((s) => `${s.shortcut} -> ${s.name}`).join(" | ")
    : "No section shortcuts";
  rows.push({ key: "Section keys", action: sectionText });

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

// --- Playback/sync core ---
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
  toggleLoopBtn.disabled = true;
  setLoopABtn.disabled = true;
  setLoopBBtn.disabled = true;
  clearLoopBtn.disabled = true;
  resyncBtn.disabled = true;
}

function enableTransport() {
  playBtn.disabled = false;
  restartBtn.disabled = false;
  mutePianoBtn.disabled = false;
  scrubber.disabled = false;
  toggleLoopBtn.disabled = false;
  setLoopABtn.disabled = false;
  setLoopBBtn.disabled = false;
  clearLoopBtn.disabled = false;
  resyncBtn.disabled = false;
}

function stopSyncLoop() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

function maybeHandleLoop(master) {
  if (!appState.loop.enabled) return;
  if (appState.loop.aSec == null || appState.loop.bSec == null) return;
  if (master < appState.loop.bSec - 0.02) return;

  if (appState.loop.repeatTarget > 0 && appState.loop.completed >= appState.loop.repeatTarget) {
    appState.loop.enabled = false;
    renderLoopStatus();
    return;
  }

  appState.loop.completed += 1;
  appState.diagnostics.loopCycles += 1;
  renderDiagnostics();
  renderLoopStatus();
  safeSeekBoth(appState.loop.aSec, true);
}

function maybeHandlePlayWindow(master) {
  if (appState.playWindowEnd == null) return;
  if (master < appState.playWindowEnd - 0.02) return;

  if (appState.loop.enabled) return;
  songPlayer.pauseVideo();
  pianoPlayer.pauseVideo();
  setSyncing(false);
  appState.playWindowEnd = null;
}

function startSyncLoop() {
  stopSyncLoop();
  syncTimer = setInterval(() => {
    if (!canSync() || !isSyncing || userScrubbing) return;

    const master = clampMasterTime(getMasterTime());
    const targetPiano = master + pianoStartSec;
    const currentPiano = ensureNumber(pianoPlayer.getCurrentTime?.(), targetPiano);
    const drift = currentPiano - targetPiano;

    appState.diagnostics.driftMs = drift * 1000;

    if (Math.abs(drift) > 0.45 && Date.now() - lastPianoCorrectionAt > 500) {
      pianoPlayer.seekTo(Math.max(0, targetPiano), true);
      lastPianoCorrectionAt = Date.now();
      appState.diagnostics.corrections += 1;
    }

    setTransportTime(master);
    setActiveLyricByTime(master);
    maybeHandleLoop(master);
    maybeHandlePlayWindow(master);
    renderDiagnostics();

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
  lastPlayRequestAt = Date.now();
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
  appState.playWindowEnd = null;
  safeSeekBoth(0);
}

function toggleMutePiano() {
  if (!pianoPlayer || !pianoPlayer.isMuted) return;
  if (pianoPlayer.isMuted()) pianoPlayer.unMute();
  else pianoPlayer.mute();
  updateMuteIcon();
}

function readOffsets() {
  songStartSec = Math.max(0, ensureNumber(el("songOffset").value, 0));
  pianoStartSec = Math.max(0, ensureNumber(el("pianoOffset").value, 0));
}

function calibrateUsingCurrentFrame() {
  if (!canSync()) {
    setCalibrateStatus("Load both videos first.");
    return;
  }

  const songCurrent = ensureNumber(songPlayer.getCurrentTime?.(), 0);
  const pianoCurrent = ensureNumber(pianoPlayer.getCurrentTime?.(), 0);
  const currentSongOffset = Math.max(0, ensureNumber(el("songOffset").value, 0));
  const delta = pianoCurrent - songCurrent;
  const newPianoOffset = Math.max(0, currentSongOffset + delta);

  el("pianoOffset").value = String(round2(newPianoOffset));
  readOffsets();

  const master = Math.max(0, songCurrent - songStartSec);
  safeSeekBoth(master, true);

  const deltaText = `${delta >= 0 ? "+" : ""}${round2(delta)}s`;
  setCalibrateStatus(`Calibration saved. Tutorial offset adjusted by ${deltaText}.`);
  scheduleAutosave();
}

// --- Loop controls ---
function renderLoopStatus() {
  const a = appState.loop.aSec;
  const b = appState.loop.bSec;
  const aTxt = a == null ? "--:--" : fmtTime(a);
  const bTxt = b == null ? "--:--" : fmtTime(b);
  const repeats = appState.loop.repeatTarget === 0 ? "inf" : String(appState.loop.repeatTarget);
  const enabledText = appState.loop.enabled ? "On" : "Off";
  loopStatus.textContent = `Loop ${enabledText} | A ${aTxt} | B ${bTxt} | ${appState.loop.completed}/${repeats}`;
}

function setLoopPoint(which) {
  if (!canSync()) return;
  const master = clampMasterTime(getMasterTime());
  if (which === "a") appState.loop.aSec = master;
  else appState.loop.bSec = master;

  if (appState.loop.aSec != null && appState.loop.bSec != null && appState.loop.bSec <= appState.loop.aSec) {
    appState.loop.bSec = appState.loop.aSec + 0.2;
  }

  appState.loop.completed = 0;
  renderLoopStatus();
  scheduleAutosave();
}

function clearLoop() {
  appState.loop.enabled = false;
  appState.loop.aSec = null;
  appState.loop.bSec = null;
  appState.loop.completed = 0;
  renderLoopStatus();
  scheduleAutosave();
}

function toggleLoopEnabled() {
  if (appState.loop.aSec == null || appState.loop.bSec == null) {
    alert("Set both loop points A and B first.");
    return;
  }

  appState.loop.repeatTarget = Math.max(0, Math.floor(ensureNumber(loopRepeatsInput.value, appState.loop.repeatTarget)));
  appState.loop.enabled = !appState.loop.enabled;
  if (appState.loop.enabled) appState.loop.completed = 0;
  renderLoopStatus();
  scheduleAutosave();
}

function resyncNow() {
  if (!canSync()) return;
  const t = clampMasterTime(getMasterTime());
  safeSeekBoth(t, true);
}

// --- Presets ---
function renderPresetSelect() {
  presetSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = appState.songs.length ? "Select preset..." : "No presets loaded";
  presetSelect.appendChild(placeholder);
  if (!appState.songs.length) return;

  appState.songs.forEach((song, idx) => {
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

  const bpm = clamp(Math.round(ensureNumber(song.metronomeBpm, 92)), 30, 300);
  const beatsPerBar = clamp(
    Math.round(ensureNumber(song.metronomeBeatsPerBar ?? song.metronomeBeats ?? 4, 4)),
    1,
    12
  );
  metronomeBpm.value = String(bpm);
  metronomeBeatsPerBar.value = String(beatsPerBar);
  metronome.setBpm(bpm);
  metronome.setBeatsPerBar(beatsPerBar);

  const rawLyrics = String(song.lyrics || "");
  el("lyricsPaste").value = rawLyrics;
  lyrics = rawLyrics ? parseLRC(rawLyrics) : [];
  renderLyrics();

  appState.markers = Array.isArray(song.markers)
    ? song.markers.map(normalizeMarker).filter(Boolean)
    : [];
  sortMarkers();
  renderMarkersList();

  appState.sections = Array.isArray(song.sections)
    ? song.sections.map(normalizeSection).filter(Boolean)
    : [];
  renderSectionsList();

  appState.loop.enabled = false;
  appState.loop.aSec = null;
  appState.loop.bSec = null;
  appState.loop.repeatTarget = Math.max(0, Math.floor(ensureNumber(song.loopRepeatTarget, 4)));
  appState.loop.completed = 0;
  loopRepeatsInput.value = String(appState.loop.repeatTarget);
  renderLoopStatus();

  renderShortcutsList();
  scheduleAutosave();
}

function exportCurrentPreset() {
  const obj = {
    name: el("presetName").value.trim() || "Untitled preset",
    songUrl: el("songUrl").value.trim(),
    pianoUrl: el("pianoUrl").value.trim(),
    songStartSec: ensureNumber(el("songOffset").value, 0),
    pianoStartSec: ensureNumber(el("pianoOffset").value, 0),
    countdownSec: Math.max(0, Math.floor(ensureNumber(el("countdownSec").value, 0))),
    metronomeBpm: clamp(Math.round(ensureNumber(metronomeBpm.value, 92)), 30, 300),
    metronomeBeatsPerBar: clamp(Math.round(ensureNumber(metronomeBeatsPerBar.value, 4)), 1, 12),
    loopRepeatTarget: Math.max(0, Math.floor(ensureNumber(loopRepeatsInput.value, 4))),
    lyrics: el("lyricsPaste").value.trim(),
    markers: appState.markers.map((m) => ({
      key: m.key,
      name: m.name,
      source: m.source,
      timeSec: round2(m.timeSec)
    })),
    sections: appState.sections.map((s) => ({
      name: s.name,
      color: s.color,
      startSec: round2(s.startSec),
      endSec: s.endSec == null ? null : round2(s.endSec),
      repeatCount: s.repeatCount,
      shortcut: s.shortcut
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
    appState.songs = data;
    setPresetStatus(`Loaded ${data.length} preset(s).`);
  } catch (err) {
    console.warn(err);
    appState.songs = [];
    setPresetStatus("Could not load songs.json. Run from a local server.");
  }

  renderPresetSelect();
  presetSelect.value = "";
}

// --- Autosave draft/recovery ---
function collectDraftState() {
  return {
    version: 3,
    savedAt: Date.now(),
    fields: {
      presetName: el("presetName").value,
      songUrl: el("songUrl").value,
      pianoUrl: el("pianoUrl").value,
      songOffset: el("songOffset").value,
      pianoOffset: el("pianoOffset").value,
      countdownSec: el("countdownSec").value,
      lyricsPaste: el("lyricsPaste").value,
      loopRepeats: loopRepeatsInput.value,
      metronomeBpm: metronomeBpm.value,
      metronomeBeatsPerBar: metronomeBeatsPerBar.value,
      themeMode: document.body.dataset.themeMode || "system"
    },
    markers: appState.markers,
    sections: appState.sections,
    shortcuts: appState.shortcuts,
    loop: {
      aSec: appState.loop.aSec,
      bSec: appState.loop.bSec,
      repeatTarget: appState.loop.repeatTarget,
      enabled: appState.loop.enabled
    },
      metronomeEnabled: metronome.enabled
  };
}

function saveDraftNow() {
  const payload = collectDraftState();
  safeLocalStorageSet(DRAFT_STORAGE_KEY, JSON.stringify(payload));
}

function scheduleAutosave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(saveDraftNow, 280);
}

function restoreDraft() {
  const raw = safeLocalStorageGet(DRAFT_STORAGE_KEY, null);
  if (!raw) return false;

  try {
    const draft = JSON.parse(raw);
    if (!draft || typeof draft !== "object") return false;

    const f = draft.fields || {};
    if (typeof f.presetName === "string") el("presetName").value = f.presetName;
    if (typeof f.songUrl === "string") el("songUrl").value = f.songUrl;
    if (typeof f.pianoUrl === "string") el("pianoUrl").value = f.pianoUrl;
    if (typeof f.songOffset === "string") el("songOffset").value = f.songOffset;
    if (typeof f.pianoOffset === "string") el("pianoOffset").value = f.pianoOffset;
    if (typeof f.countdownSec === "string") el("countdownSec").value = f.countdownSec;
    if (typeof f.lyricsPaste === "string") el("lyricsPaste").value = f.lyricsPaste;
    if (typeof f.loopRepeats === "string") loopRepeatsInput.value = f.loopRepeats;
    if (typeof f.metronomeBpm === "string") metronomeBpm.value = f.metronomeBpm;
    if (typeof f.metronomeBeatsPerBar === "string") metronomeBeatsPerBar.value = f.metronomeBeatsPerBar;

    if (THEME_MODES.includes(f.themeMode)) applyTheme(f.themeMode, false);

    appState.markers = Array.isArray(draft.markers)
      ? draft.markers.map(normalizeMarker).filter(Boolean)
      : [];

    appState.sections = Array.isArray(draft.sections)
      ? draft.sections.map(normalizeSection).filter(Boolean)
      : [];

    if (draft.shortcuts && typeof draft.shortcuts === "object") {
      appState.shortcuts = {
        playPause: normalizeShortcutValue(draft.shortcuts.playPause, DEFAULT_SHORTCUTS.playPause),
        restart: normalizeShortcutValue(draft.shortcuts.restart, DEFAULT_SHORTCUTS.restart),
        mute: normalizeShortcutValue(draft.shortcuts.mute, DEFAULT_SHORTCUTS.mute),
        lyricsFocus: normalizeShortcutValue(draft.shortcuts.lyricsFocus, DEFAULT_SHORTCUTS.lyricsFocus),
        practiceMode: normalizeShortcutValue(draft.shortcuts.practiceMode, DEFAULT_SHORTCUTS.practiceMode),
        metronomeToggle: normalizeShortcutValue(draft.shortcuts.metronomeToggle, DEFAULT_SHORTCUTS.metronomeToggle)
      };
    }

    if (draft.loop && typeof draft.loop === "object") {
      appState.loop.aSec = draft.loop.aSec == null ? null : ensureNumber(draft.loop.aSec, 0);
      appState.loop.bSec = draft.loop.bSec == null ? null : ensureNumber(draft.loop.bSec, 0);
      appState.loop.repeatTarget = Math.max(0, Math.floor(ensureNumber(draft.loop.repeatTarget, 4)));
      appState.loop.enabled = Boolean(draft.loop.enabled);
    }

    metronome.setBpm(clamp(Math.round(ensureNumber(metronomeBpm.value, 92)), 30, 300));
    metronome.setBeatsPerBar(clamp(Math.round(ensureNumber(metronomeBeatsPerBar.value, 4)), 1, 12));
    metronome.setEnabled(Boolean(draft.metronomeEnabled));

    lyrics = el("lyricsPaste").value.trim() ? parseLRC(el("lyricsPaste").value.trim()) : [];
    renderLyrics();
    renderMarkersList();
    renderSectionsList();
    loadShortcutInputsFromState();
    renderShortcutsList();
    renderLoopStatus();
    setMetronomeButtonLabel();

    setPresetStatus("Recovered previous draft from autosave.");
    return true;
  } catch {
    return false;
  }
}

// --- YouTube API and player lifecycle ---
function onPlayerStateChange(evt) {
  if (!canSync()) return;

  const stateCode = evt?.data;
  const recentPlayRequest = Date.now() - lastPlayRequestAt < 2200;

  if (stateCode === YT.PlayerState.BUFFERING) {
    appState.diagnostics.bufferingEvents += 1;
    renderDiagnostics();
  }

  if (stateCode === YT.PlayerState.PLAYING && !isSyncing) {
    if (isPreparingPlayers || !recentPlayRequest) {
      songPlayer.pauseVideo();
      pianoPlayer.pauseVideo();
      setSyncing(false);
      return;
    }
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
  lastPlayRequestAt = 0;
  isPreparingPlayers = true;
  disableTransport();
  readySong = false;
  readyPiano = false;
  duration = 0;
  appState.playWindowEnd = null;

  appState.diagnostics.driftMs = 0;
  appState.diagnostics.corrections = 0;
  appState.diagnostics.bufferingEvents = 0;
  appState.diagnostics.loopCycles = 0;
  renderDiagnostics();

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
      songPlayer.pauseVideo();
      pianoPlayer.pauseVideo();
      setSyncing(false);
      enableTransport();
      updateMuteIcon();
      setTransportTime(0);
      setActiveLyricByTime(0);
      setCalibrateStatus("Players loaded. If both frames match musically, click calibration.");
      isPreparingPlayers = false;
      scheduleAutosave();
    }, 240);
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

// --- Metronome UI ---
function setMetronomeButtonLabel() {
  toggleMetronomeBtn.textContent = metronome.enabled ? "Metronome On" : "Metronome Off";
}

function toggleMetronome() {
  metronome.setBpm(ensureNumber(metronomeBpm.value, 92));
  metronome.setBeatsPerBar(ensureNumber(metronomeBeatsPerBar.value, 4));
  metronome.setEnabled(!metronome.enabled);
  metronome.syncWithPlayback(isSyncing);
  setMetronomeButtonLabel();
  scheduleAutosave();
}

// --- Events ---
loadBtn.addEventListener("click", loadPlayers);
calibrateBtn.addEventListener("click", calibrateUsingCurrentFrame);
playBtn.addEventListener("click", togglePlayPause);
restartBtn.addEventListener("click", restart);
mutePianoBtn.addEventListener("click", toggleMutePiano);
resyncBtn.addEventListener("click", resyncNow);

el("usePastedBtn").addEventListener("click", usePastedLyrics);
el("exportPresetBtn").addEventListener("click", exportCurrentPreset);

el("applyPresetBtn").addEventListener("click", () => {
  const idx = Number.parseInt(presetSelect.value, 10);
  if (Number.isFinite(idx) && appState.songs[idx]) {
    applyPreset(appState.songs[idx]);
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
closeShortcutsBtn.addEventListener("click", closeShortcuts);
shortcutsModal.addEventListener("click", (evt) => {
  if (evt.target === shortcutsModal) closeShortcuts();
});

themeBtn.addEventListener("click", () => {
  const currentMode = document.body.dataset.themeMode || "system";
  applyTheme(nextThemeMode(currentMode), true);
  scheduleAutosave();
});

lyricsFocusBtn.addEventListener("click", () => {
  document.body.classList.toggle("lyrics-focus");
});

practiceModeBtn.addEventListener("click", togglePracticeMode);
document.addEventListener("fullscreenchange", onFullscreenChange);

useCurrentMarkerBtn.addEventListener("click", setMarkerTimeFromCurrent);
addMarkerBtn.addEventListener("click", addOrUpdateMarkerFromForm);

useCurrentSectionStartBtn.addEventListener("click", setSectionStartFromCurrent);
useCurrentSectionEndBtn.addEventListener("click", setSectionEndFromCurrent);
addSectionBtn.addEventListener("click", addOrUpdateSectionFromForm);

setLoopABtn.addEventListener("click", () => setLoopPoint("a"));
setLoopBBtn.addEventListener("click", () => setLoopPoint("b"));
toggleLoopBtn.addEventListener("click", toggleLoopEnabled);
clearLoopBtn.addEventListener("click", clearLoop);

loopRepeatsInput.addEventListener("change", () => {
  appState.loop.repeatTarget = Math.max(0, Math.floor(ensureNumber(loopRepeatsInput.value, 4)));
  renderLoopStatus();
  scheduleAutosave();
});

metronomeBpm.addEventListener("change", () => {
  const bpm = clamp(Math.round(ensureNumber(metronomeBpm.value, 92)), 30, 300);
  metronomeBpm.value = String(bpm);
  metronome.setBpm(bpm);
  scheduleAutosave();
});

metronomeBeatsPerBar.addEventListener("change", () => {
  const beats = clamp(Math.round(ensureNumber(metronomeBeatsPerBar.value, 4)), 1, 12);
  metronomeBeatsPerBar.value = String(beats);
  metronome.setBeatsPerBar(beats);
  scheduleAutosave();
});

toggleMetronomeBtn.addEventListener("click", toggleMetronome);

saveShortcutsBtn.addEventListener("click", applyShortcutInputs);
resetShortcutsBtn.addEventListener("click", resetShortcuts);

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

  if (keyMatchesShortcut(e, appState.shortcuts.playPause)) {
    e.preventDefault();
    togglePlayPause();
    return;
  }

  if (keyMatchesShortcut(e, appState.shortcuts.restart)) {
    restart();
    return;
  }

  if (keyMatchesShortcut(e, appState.shortcuts.mute)) {
    toggleMutePiano();
    return;
  }

  if (keyMatchesShortcut(e, appState.shortcuts.lyricsFocus)) {
    document.body.classList.toggle("lyrics-focus");
    return;
  }

  if (keyMatchesShortcut(e, appState.shortcuts.practiceMode)) {
    togglePracticeMode();
    return;
  }

  if (keyMatchesShortcut(e, appState.shortcuts.metronomeToggle)) {
    toggleMetronome();
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
    return;
  }

  const section = findSectionByShortcut(key);
  if (section) {
    playSection(section, false);
  }
});

document.addEventListener("input", (evt) => {
  const id = evt.target?.id;
  if (id === "exportOutput") return;
  scheduleAutosave();
});

document.addEventListener("change", (evt) => {
  const id = evt.target?.id;
  if (id === "exportOutput") return;
  scheduleAutosave();
});

// --- Init ---
populateMarkerKeys();
populateSectionShortcutOptions();
initTheme();
loadShortcutMap();
setConfigCollapsed(false);
disableTransport();
renderLyrics();
renderMarkersList();
renderSectionsList();
renderShortcutsList();
renderLoopStatus();
renderDiagnostics();
updateMuteIcon();
setMetronomeButtonLabel();
metronome.setBeatsPerBar(clamp(Math.round(ensureNumber(metronomeBeatsPerBar.value, 4)), 1, 12));
loadSongs();
