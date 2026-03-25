/* global YT */

const el = (id) => document.getElementById(id);

const PLAY_ICON_PATH = "M8 5v14l11-7z";
const PAUSE_ICON_PATH = "M6 5h4v14H6zm8 0h4v14h-4z";
const MUTE_ICON_PATH = "M5 9v6h4l5 5V4L9 9Zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4";
const UNMUTE_ICON_PATH = "M5 9v6h4l5 5V4L9 9Zm9.6 3 2.4 2.4 1.4-1.4-2.4-2.4 2.4-2.4-1.4-1.4-2.4 2.4-2.4-2.4-1.4 1.4 2.4 2.4-2.4 2.4 1.4 1.4z";
const THEME_MODES = ["system", "dark", "light"];
const SECTION_SHORTCUT_KEYS = ["", "Z", "X", "C", "V", "B", "N", "J", "U", "I"];
const MARKER_JUMP_POOL = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
  "-", "=", "Q", "W", "E", "Y", "U", "I", "O", "P",
  "[", "]", "A", "S", "D", "G", "H", "J", "K", ";"
];
const LYRICS_POSITIONS = ["left", "right", "top", "bottom"];

const PLAYER_STATUS_LABELS = {
  idle: "Not loaded",
  loading: "Loading",
  ready: "Ready",
  playing: "Playing",
  paused: "Paused",
  buffering: "Buffering",
  ended: "Ended",
  error: "Error"
};

const STORAGE_KEYS = {
  theme: "sync-player-theme",
  draft: "sync-player-draft-v5",
  settings: "sync-player-settings-v5",
  cookies: "sync-player-cookie-consent"
};

const DELETE_ACCOUNT_CONFIRMATION = "DELETE MY ACCOUNT";

const dom = {
  bootstrapStatus: el("bootstrapStatus"),
  navLobbyBtn: el("navLobbyBtn"),
  navWorkspaceBtn: el("navWorkspaceBtn"),
  authIndicator: el("authIndicator"),
  loginBtn: el("loginBtn"),
  signupBtn: el("signupBtn"),
  logoutBtn: el("logoutBtn"),
  profileBtn: el("profileBtn"),
  themeBtn: el("themeBtn"),
  openShortcutsBtn: el("openShortcutsBtn"),
  heroCreateSongBtn: el("heroCreateSongBtn"),
  createSongBtn: el("createSongBtn"),
  songSearch: el("songSearch"),
  lobbyGrid: el("lobbyGrid"),
  workspaceSection: el("workspaceSection"),
  practiceContextBar: el("practiceContextBar"),
  practiceSongTitle: el("practiceSongTitle"),
  practiceSongMeta: el("practiceSongMeta"),
  practiceBackBtn: el("practiceBackBtn"),
  practiceWorkspaceBtn: el("practiceWorkspaceBtn"),
  workspaceTitle: el("workspaceTitle"),
  editorStatus: el("editorStatus"),
  editorModeBadge: el("editorModeBadge"),
  saveSongBtn: el("saveSongBtn"),
  newDraftBtn: el("newDraftBtn"),
  songTitle: el("songTitle"),
  songArtist: el("songArtist"),
  songSummary: el("songSummary"),
  songUrl: el("songUrl"),
  pianoUrl: el("pianoUrl"),
  songOffset: el("songOffset"),
  pianoOffset: el("pianoOffset"),
  countdownSec: el("countdownSec"),
  publishSongToggle: el("publishSongToggle"),
  loadBtn: el("loadBtn"),
  calibrateBtn: el("calibrateBtn"),
  calibrateStatus: el("calibrateStatus"),
  lyricsPaste: el("lyricsPaste"),
  usePastedBtn: el("usePastedBtn"),
  exportPresetBtn: el("exportPresetBtn"),
  exportOutput: el("exportOutput"),
  markerName: el("markerName"),
  markerTime: el("markerTime"),
  useCurrentMarkerBtn: el("useCurrentMarkerBtn"),
  addMarkerBtn: el("addMarkerBtn"),
  captureMarkerBtn: el("captureMarkerBtn"),
  markersList: el("markersList"),
  markerThresholdHint: el("markerThresholdHint"),
  sectionName: el("sectionName"),
  sectionColor: el("sectionColor"),
  sectionStart: el("sectionStart"),
  sectionEnd: el("sectionEnd"),
  sectionRepeat: el("sectionRepeat"),
  sectionShortcut: el("sectionShortcut"),
  useCurrentSectionStartBtn: el("useCurrentSectionStartBtn"),
  useCurrentSectionEndBtn: el("useCurrentSectionEndBtn"),
  addSectionBtn: el("addSectionBtn"),
  sectionsList: el("sectionsList"),
  autoPracticeOnPlay: el("autoPracticeOnPlay"),
  showPracticeShortcutLegend: el("showPracticeShortcutLegend"),
  markerRetargetThreshold: el("markerRetargetThreshold"),
  keyPlayPause: el("keyPlayPause"),
  keyRestart: el("keyRestart"),
  keyMute: el("keyMute"),
  keyLyricsFocus: el("keyLyricsFocus"),
  keyPracticeMode: el("keyPracticeMode"),
  keyMetronomeToggle: el("keyMetronomeToggle"),
  keyToggleShortcutLegend: el("keyToggleShortcutLegend"),
  keyCaptureMarker: el("keyCaptureMarker"),
  saveShortcutsBtn: el("saveShortcutsBtn"),
  resetShortcutsBtn: el("resetShortcutsBtn"),
  shortcutStatus: el("shortcutStatus"),
  practiceShortcutSummary: el("practiceShortcutSummary"),
  markerJumpLegend: el("markerJumpLegend"),
  togglePracticeHelperBtn: el("togglePracticeHelperBtn"),
  togglePracticeLyricsBtn: el("togglePracticeLyricsBtn"),
  practiceHelperSection: el("practiceHelperSection"),
  practiceHelper: el("practiceHelper"),
  practiceModeBtn: el("practiceModeBtn"),
  playerSurface: el("playerSurface"),
  practiceStage: el("practiceStage"),
  playersGrid: el("playersGrid"),
  practiceStageSizer: el("practiceStageSizer"),
  practiceStageBalance: el("practiceStageBalance"),
  practiceLayoutStatus: el("practiceLayoutStatus"),
  practiceLayoutBadge: el("practiceLayoutBadge"),
  resetPracticeStageBtn: el("resetPracticeStageBtn"),
  practiceReferenceRail: el("practiceReferenceRail"),
  lyricsSection: el("lyricsSection"),
  lyricsPositionControls: el("lyricsPositionControls"),
  lyricsFocusBtn: el("lyricsFocusBtn"),
  lyricsBox: el("lyricsBox"),
  timeLabel: el("timeLabel"),
  scrubber: el("scrubber"),
  playBtn: el("playBtn"),
  restartBtn: el("restartBtn"),
  mutePianoBtn: el("mutePianoBtn"),
  playIconPath: el("playIconPath"),
  muteIconPath: el("muteIconPath"),
  toggleLoopBtn: el("toggleLoopBtn"),
  setLoopABtn: el("setLoopABtn"),
  setLoopBBtn: el("setLoopBBtn"),
  clearLoopBtn: el("clearLoopBtn"),
  loopRepeats: el("loopRepeats"),
  loopStatus: el("loopStatus"),
  metronomeBpm: el("metronomeBpm"),
  metronomeBeatsPerBar: el("metronomeBeatsPerBar"),
  toggleMetronomeBtn: el("toggleMetronomeBtn"),
  resyncBtn: el("resyncBtn"),
  diagDrift: el("diagDrift"),
  diagCorrections: el("diagCorrections"),
  diagBuffering: el("diagBuffering"),
  diagLoops: el("diagLoops"),
  pianoPlayerStatus: el("pianoPlayerStatus"),
  songPlayerStatus: el("songPlayerStatus"),
  countdownOverlay: el("countdownOverlay"),
  countdownValue: el("countdownValue"),
  shortcutsModal: el("shortcutsModal"),
  closeShortcutsBtn: el("closeShortcutsBtn"),
  shortcutsList: el("shortcutsList"),
  authModal: el("authModal"),
  closeAuthModalBtn: el("closeAuthModalBtn"),
  authTabLogin: el("authTabLogin"),
  authTabSignup: el("authTabSignup"),
  authForm: el("authForm"),
  authDisplayNameField: el("authDisplayNameField"),
  authDisplayName: el("authDisplayName"),
  authEmail: el("authEmail"),
  authSubmitBtn: el("authSubmitBtn"),
  authEmailHelp: el("authEmailHelp"),
  authStatus: el("authStatus"),
  authDivider: el("authDivider"),
  googleAuthSection: el("googleAuthSection"),
  googleAuthButton: el("googleAuthButton"),
  profileModal: el("profileModal"),
  closeProfileModalBtn: el("closeProfileModalBtn"),
  profileNameText: el("profileNameText"),
  profileEmailText: el("profileEmailText"),
  mySongsList: el("mySongsList"),
  deleteAccountConfirmInput: el("deleteAccountConfirmInput"),
  deleteAccountBtn: el("deleteAccountBtn"),
  deleteAccountStatus: el("deleteAccountStatus"),
  cookieBanner: el("cookieBanner"),
  cookieEssentialBtn: el("cookieEssentialBtn"),
  cookieAcceptBtn: el("cookieAcceptBtn"),
  toastRegion: el("toastRegion")
};

const app = {
  bootstrap: null,
  session: null,
  profile: null,
  songs: [],
  mySongs: [],
  settings: null,
  currentSongId: "",
  currentSongCanEdit: false,
  currentSongOwner: "",
  screen: "lobby",
  returnScreen: "lobby",
  lyrics: [],
  markers: [],
  sections: [],
  searchTerm: "",
  authMode: "login",
  googleInitialized: false,
  practiceHelperVisible: true,
  practiceLyricsVisible: true,
  practiceLyricsDense: false,
  practiceLayout: {
    manual: false,
    balance: 54,
    autoBalance: 54,
    mode: "stack",
    lyricsPosition: "left"
  },
  playerUiState: {
    song: { hasStartedPlayback: false },
    piano: { hasStartedPlayback: false }
  },
  loop: {
    enabled: false,
    aSec: null,
    bSec: null,
    repeatTarget: 4,
    completed: 0
  },
  diagnostics: {
    driftMs: 0,
    corrections: 0,
    bufferingEvents: 0,
    loopCycles: 0
  }
};

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
let countdownTimer = null;
let ytApiPromise = null;
let lastPlayRequestAt = 0;
let lastPianoCorrectionAt = 0;
let lastActiveLyricIndex = -1;
let autosaveTimer = null;
let practiceLayoutFrame = 0;
let lyricsFitFrame = 0;
let practiceResizeObserver = null;
let practiceResizeObserverFrame = 0;
let practiceResizeObserverAction = "";
let lastObservedPlayerSurfaceSize = "";
let lastObservedContextBarSize = "";
let lastObservedLyricsBoxSize = "";
let googleIdentityPromise = null;

class MetronomeEngine {
  constructor() {
    this.enabled = false;
    this.audioCtx = null;
    this.bpm = 92;
    this.beatsPerBar = 4;
    this.timer = null;
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
    osc.frequency.setValueAtTime(accent ? 1220 : 860, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
    this.beatIndex += 1;
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

function ensureNumber(value, fallback = 0) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function genId(prefix) {
  if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : raw;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures.
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore.
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

function showToast(message, kind = "info") {
  if (!message) return;
  const node = document.createElement("div");
  node.className = "toast";
  node.dataset.kind = kind || "info";
  const title = document.createElement("strong");
  title.textContent = kind === "danger"
    ? "Heads up"
    : kind === "success"
      ? "Done"
      : "Notice";
  const body = document.createElement("div");
  body.textContent = message;
  node.append(title, body);
  dom.toastRegion.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

function extractYouTubeId(url) {
  try {
    const u = new URL(String(url).trim());
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
}

function getYouTubeThumbnail(url) {
  const id = extractYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

function getAuthErrorFeedback(error) {
  const rawMessage = String(error?.message || "").trim();
  return {
    inline: rawMessage || "Authentication failed.",
    toast: rawMessage || "Authentication failed."
  };
}

function emailAuthEnabled() {
  return Boolean(app.bootstrap?.auth?.emailEnabled);
}

function googleAuthEnabled() {
  return Boolean(app.bootstrap?.auth?.googleEnabled && app.bootstrap?.auth?.googleClientId);
}

function getYouTubeInputIssue(label, rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return `${label} URL is required.`;
  if (!extractYouTubeId(value)) return `${label} URL is not a valid YouTube link.`;
  return "";
}

function fmtTime(sec) {
  const safe = Math.max(0, Number(sec) || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function parseLRC(text) {
  const lines = [];
  const re = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]\s*(.*)/g;
  for (const row of String(text || "").split(/\r?\n/)) {
    let match;
    let matched = false;
    while ((match = re.exec(row)) !== null) {
      matched = true;
      const mm = Number.parseInt(match[1], 10);
      const ss = Number.parseInt(match[2], 10);
      const cs = match[3] ? Number.parseInt(match[3].padEnd(2, "0"), 10) : 0;
      const time = mm * 60 + ss + cs / 100;
      const content = String(match[4] || "").trim();
      if (content) lines.push({ t: time, content });
    }
    if (!matched && row.trim()) {
      lines.push({ t: null, content: row.trim() });
    }
    re.lastIndex = 0;
  }
  if (lines.some((line) => line.t != null)) {
    return lines.filter((line) => line.t != null).sort((a, b) => a.t - b.t);
  }
  return lines.map((line) => ({ t: null, content: line.content }));
}

function getDefaultSettings() {
  return JSON.parse(JSON.stringify(app.bootstrap?.defaultSettings || {
    themeMode: "system",
    autoEnterPracticeOnPlay: true,
    showPracticeShortcutLegend: true,
    markerRetargetThresholdSec: 5,
    shortcuts: {
      playPause: "Space",
      restart: "R",
      mute: "M",
      lyricsFocus: "L",
      practiceMode: "F",
      metronomeToggle: "T",
      toggleShortcutLegend: "H",
      captureMarker: "Q"
    }
  }));
}

function getStoredSettingsOrDefault() {
  try {
    const raw = safeGet(STORAGE_KEYS.settings, null);
    return raw ? JSON.parse(raw) : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
}

function normalizeSettings(settings) {
  const defaults = getDefaultSettings();
  const next = {
    ...defaults,
    ...settings,
    shortcuts: {
      ...defaults.shortcuts,
      ...(settings?.shortcuts || {})
    }
  };
  next.themeMode = THEME_MODES.includes(next.themeMode) ? next.themeMode : defaults.themeMode;
  next.markerRetargetThresholdSec = clamp(ensureNumber(next.markerRetargetThresholdSec, defaults.markerRetargetThresholdSec), 0.5, 30);
  next.shortcuts.playPause = normalizeShortcutValue(next.shortcuts.playPause, defaults.shortcuts.playPause);
  next.shortcuts.restart = normalizeShortcutValue(next.shortcuts.restart, defaults.shortcuts.restart);
  next.shortcuts.mute = normalizeShortcutValue(next.shortcuts.mute, defaults.shortcuts.mute);
  next.shortcuts.lyricsFocus = normalizeShortcutValue(next.shortcuts.lyricsFocus, defaults.shortcuts.lyricsFocus);
  next.shortcuts.practiceMode = normalizeShortcutValue(next.shortcuts.practiceMode, defaults.shortcuts.practiceMode);
  next.shortcuts.metronomeToggle = normalizeShortcutValue(next.shortcuts.metronomeToggle, defaults.shortcuts.metronomeToggle);
  next.shortcuts.toggleShortcutLegend = normalizeShortcutValue(next.shortcuts.toggleShortcutLegend, defaults.shortcuts.toggleShortcutLegend);
  next.shortcuts.captureMarker = normalizeShortcutValue(next.shortcuts.captureMarker, defaults.shortcuts.captureMarker);
  return next;
}

function applyTheme(mode, persist = true) {
  const safeMode = THEME_MODES.includes(mode) ? mode : "system";
  const resolved = safeMode === "system"
    ? (window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : safeMode;
  document.body.dataset.themeMode = safeMode;
  document.body.dataset.theme = resolved;
  dom.themeBtn.textContent = `Theme: ${safeMode === "system" ? "Auto" : safeMode[0].toUpperCase() + safeMode.slice(1)}`;
  if (persist) safeSet(STORAGE_KEYS.theme, safeMode);
}

function initTheme() {
  const stored = safeGet(STORAGE_KEYS.theme, null);
  const preferred = THEME_MODES.includes(stored) ? stored : (app.settings?.themeMode || "system");
  applyTheme(preferred, false);
}

function nextThemeMode(current) {
  const index = THEME_MODES.indexOf(current);
  return THEME_MODES[(index + 1) % THEME_MODES.length];
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin"
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }
  return data;
}

function setBootstrapStatus(text) {
  dom.bootstrapStatus.textContent = text;
}

function setEditorStatus(text) {
  dom.editorStatus.textContent = text;
}

function setCalibrateStatus(text) {
  dom.calibrateStatus.textContent = text;
}

function setShortcutStatus(text) {
  dom.shortcutStatus.textContent = text;
}

function setPlayerStatus(which, state, label = "") {
  const target = which === "song" ? dom.songPlayerStatus : dom.pianoPlayerStatus;
  target.dataset.state = state;
  target.textContent = label || PLAYER_STATUS_LABELS[state] || state;
}

function setAuthIndicator() {
  const authed = Boolean(app.session?.user);
  dom.authIndicator.dataset.state = authed ? "authenticated" : "guest";
  dom.authIndicator.textContent = authed ? "Logged in" : "Guest";
  dom.loginBtn.classList.toggle("hidden", authed);
  dom.signupBtn.classList.toggle("hidden", authed);
  dom.profileBtn.classList.toggle("hidden", !authed);
  dom.logoutBtn.classList.toggle("hidden", !authed);
}

function canCreateSongs() {
  return Boolean(app.session?.user);
}

function canEditCurrentSong() {
  return Boolean(app.session?.user && app.currentSongId && app.currentSongCanEdit);
}

function canAccessWorkspace() {
  return canCreateSongs() && (!app.currentSongId || app.currentSongCanEdit);
}

function hasPracticeCandidate() {
  return Boolean(app.currentSongId || (dom.songUrl.value.trim() && dom.pianoUrl.value.trim()));
}

function currentSongLabel() {
  const title = dom.songTitle.value.trim() || "Untitled song";
  const artist = dom.songArtist.value.trim();
  return artist ? `${artist} — ${title}` : title;
}

function renderCreateActions() {
  const authed = canCreateSongs();
  dom.heroCreateSongBtn.textContent = authed ? "Create a new sync" : "Log in to create songs";
  dom.createSongBtn.textContent = authed ? "New song" : "Log in to add songs";
  dom.newDraftBtn.disabled = !authed;
  dom.navWorkspaceBtn.classList.toggle("hidden", !canAccessWorkspace());
  dom.practiceWorkspaceBtn.classList.toggle("hidden", !canEditCurrentSong());
}

function renderPracticeContext() {
  dom.practiceContextBar.classList.toggle("hidden", app.screen !== "practice");
  dom.practiceBackBtn.textContent = app.returnScreen === "workspace" && canAccessWorkspace()
    ? "Back to workspace"
    : "Back to songs";

  if (!app.currentSongId) {
    dom.practiceSongTitle.textContent = "Pick a song to start practicing";
    dom.practiceSongMeta.textContent = "The focused practice view keeps the heavy editor out of sight until you need it.";
    return;
  }

  dom.practiceSongTitle.textContent = currentSongLabel();
  const owner = app.currentSongOwner || "Creator";
  dom.practiceSongMeta.textContent = canEditCurrentSong()
    ? `Created by ${owner}. Practice first, then jump into the workspace whenever you want to fine-tune the sync.`
    : `Created by ${owner}. This song is available for practice, while editing stays locked to its creator.`;
}

function normalizeLyricsPosition(position) {
  return LYRICS_POSITIONS.includes(position) ? position : "left";
}

function hasTimedLyrics() {
  return app.lyrics.some((line) => line.t != null);
}

function canUseDenseUntimedLyrics() {
  return app.lyrics.length > 0 && app.lyrics.every((line) => line.t == null);
}

function getLyricsDensityMetrics() {
  const texts = app.lyrics.map((line) => String(line.content || "").trim()).filter(Boolean);
  const totalChars = texts.reduce((sum, text) => sum + text.length, 0);
  const longestLine = texts.reduce((max, text) => Math.max(max, text.length), 0);
  return {
    lineCount: texts.length,
    longestLine,
    averageLine: texts.length ? totalChars / texts.length : 0,
    timed: hasTimedLyrics(),
    denseEligible: canUseDenseUntimedLyrics()
  };
}

function buildDenseUntimedLyrics(lines) {
  const groups = [];
  let current = [];

  const flush = () => {
    if (!current.length) return;
    groups.push({ t: null, content: current.join("; ") });
    current = [];
  };

  for (const line of lines) {
    const text = String(line?.content || "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    const hardBreak = /[.!?]$/.test(text) || /:$/.test(text) || text.length > 56;
    if (!current.length) {
      current.push(text);
      if (hardBreak) flush();
      continue;
    }

    const candidate = `${current.join("; ")}; ${text}`;
    const shouldMerge = current.length < 4
      && candidate.length <= 94
      && text.length <= 38
      && !hardBreak
      && current.every((part) => part.length <= 40);

    if (shouldMerge) {
      current.push(text);
    } else {
      flush();
      current.push(text);
      if (hardBreak) flush();
    }
  }

  flush();
  return groups;
}

function getRenderedLyricsLines() {
  if (!app.practiceLyricsDense || !canUseDenseUntimedLyrics()) return app.lyrics;
  return buildDenseUntimedLyrics(app.lyrics);
}

function renderLyricsPositionControls() {
  const active = normalizeLyricsPosition(app.practiceLayout.lyricsPosition);
  if (!dom.lyricsPositionControls) return;
  for (const button of dom.lyricsPositionControls.querySelectorAll("[data-lyrics-position]")) {
    const selected = button.dataset.lyricsPosition === active;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  }
}

function getPracticeViewportMetrics() {
  const viewportWidth = Math.max(window.innerWidth || 0, 360);
  const viewportHeight = Math.max(window.innerHeight || 0, 420);
  const contextHeight = dom.practiceContextBar.offsetHeight || 0;
  const availableHeight = Math.max(430, viewportHeight - contextHeight - 42);
  return { viewportWidth, viewportHeight, availableHeight };
}

function clearPracticeLayoutStyles() {
  delete document.body.dataset.practiceLayout;
  delete document.body.dataset.practiceReferenceLayout;
  delete document.body.dataset.practiceHelperVisible;
  delete document.body.dataset.practiceLyricsPosition;
  delete document.body.dataset.practiceLyricsVisible;
  dom.playerSurface.style.gridTemplateColumns = "";
  dom.playerSurface.style.gridTemplateRows = "";
  dom.playerSurface.style.gridTemplateAreas = "";
  dom.playerSurface.style.minHeight = "";
  dom.practiceStage.style.width = "";
  dom.practiceStage.style.maxWidth = "";
  dom.practiceStage.style.margin = "";
  dom.practiceStage.style.justifySelf = "";
  dom.practiceReferenceRail.style.height = "";
  dom.lyricsSection.style.height = "";
  dom.lyricsBox.style.removeProperty("--practice-lyrics-font-size");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-box-line-height");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-line-line-height");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-columns");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-column-gap");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-pad-y");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-pad-x");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-row-gap");
  dom.lyricsBox.classList.remove("denseLyrics");
  document.documentElement.style.removeProperty("--practice-player-min");
  dom.practiceStageBalance.value = String(app.practiceLayout.autoBalance || 54);
  dom.practiceLayoutStatus.textContent = "Auto fit will tune the stage to your window.";
  dom.practiceLayoutBadge.textContent = "Balanced";
  if (lyricsFitFrame) cancelAnimationFrame(lyricsFitFrame);
  lyricsFitFrame = 0;
  if (practiceResizeObserverFrame) cancelAnimationFrame(practiceResizeObserverFrame);
  practiceResizeObserverFrame = 0;
  practiceResizeObserverAction = "";
}

function estimatePracticeVideoHeight(stageWidth) {
  return Math.round(((Math.max(stageWidth, 360) - 14) / 2) * 9 / 16);
}

function computeAutoPracticeBalance(viewportWidth, viewportHeight) {
  const aspect = viewportWidth / Math.max(viewportHeight, 1);
  let balance = 58;
  if (aspect >= 2.35) balance = 42;
  else if (aspect >= 2.05) balance = 46;
  else if (aspect >= 1.8) balance = 50;
  else if (aspect >= 1.55) balance = 54;
  else if (aspect >= 1.3) balance = 58;
  else balance = 62;

  if (viewportHeight < 900) balance -= 2;
  if (viewportHeight < 760) balance -= 4;
  return clamp(Math.round(balance), 34, 74);
}

function describePracticeLayout(mode, balance, manual) {
  const emphasis = getPracticeEmphasis(balance).toLowerCase();
  const position = normalizeLyricsPosition(app.practiceLayout.lyricsPosition);
  const placement = `lyrics ${position}`;
  const layout = mode === "split"
    ? "split view"
    : mode === "compact"
      ? "compact stack"
      : "stacked view";
  return manual
    ? `Manual ${emphasis} ${layout}, ${placement}. Auto fit will snap it back to the window.`
    : `Auto-fit ${layout}, ${placement}, with a ${emphasis} stage.`;
}

function getPracticeEmphasis(balance) {
  if (balance <= 45) return "Lyrics-first";
  if (balance >= 64) return "Video-first";
  return "Balanced";
}

function clearLyricsFitStyles() {
  dom.lyricsBox.style.removeProperty("--practice-lyrics-font-size");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-box-line-height");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-line-line-height");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-columns");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-column-gap");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-pad-y");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-pad-x");
  dom.lyricsBox.style.removeProperty("--practice-lyrics-row-gap");
}

function createLyricsFitCandidate(fontPx, columns, denseMode, options = {}) {
  const position = normalizeLyricsPosition(options.position);
  const boxWidth = Math.max(0, ensureNumber(options.boxWidth, 0));
  const sidePlacement = position === "left" || position === "right";
  const roomySide = sidePlacement && boxWidth >= 320;
  const wideSide = sidePlacement && boxWidth >= 400;
  const extraWideSide = sidePlacement && boxWidth >= 500;
  const tiny = fontPx <= 8.5;
  const compact = fontPx <= 10;
  const relaxed = !denseMode && !compact && roomySide;
  return {
    fontPx,
    columns,
    denseMode,
    boxLineHeight: denseMode
      ? (tiny ? 1.02 : 1.06)
      : sidePlacement
        ? (compact ? 1.1 : relaxed ? (extraWideSide ? 1.24 : wideSide ? 1.21 : 1.18) : 1.14)
        : (compact ? 1.08 : 1.14),
    lineLineHeight: denseMode
      ? (tiny ? 1.02 : 1.06)
      : sidePlacement
        ? (compact ? 1.12 : relaxed ? (extraWideSide ? 1.28 : wideSide ? 1.24 : 1.2) : 1.16)
        : (compact ? 1.1 : 1.16),
    padY: denseMode
      ? (tiny ? 1 : 2)
      : sidePlacement
        ? (compact ? 3 : extraWideSide ? 6 : wideSide ? 5 : roomySide ? 4 : 4)
        : (compact ? 2 : 4),
    padX: denseMode
      ? (tiny ? 4 : 5)
      : sidePlacement
        ? (compact ? 6 : extraWideSide ? 11 : wideSide ? 9 : 8)
        : (compact ? 5 : 7),
    rowGap: denseMode
      ? (tiny ? 1 : 2)
      : sidePlacement
        ? (compact ? 3 : extraWideSide ? 7 : wideSide ? 6 : roomySide ? 5 : 4)
        : (compact ? 2 : 4),
    columnGap: columns >= 3 ? 12 : sidePlacement && wideSide ? 16 : 14
  };
}

function applyLyricsFitCandidate(candidate) {
  dom.lyricsBox.style.setProperty("--practice-lyrics-font-size", `${candidate.fontPx}px`);
  dom.lyricsBox.style.setProperty("--practice-lyrics-box-line-height", String(candidate.boxLineHeight));
  dom.lyricsBox.style.setProperty("--practice-lyrics-line-line-height", String(candidate.lineLineHeight));
  dom.lyricsBox.style.setProperty("--practice-lyrics-columns", String(candidate.columns));
  dom.lyricsBox.style.setProperty("--practice-lyrics-column-gap", `${candidate.columnGap}px`);
  dom.lyricsBox.style.setProperty("--practice-lyrics-pad-y", `${candidate.padY}px`);
  dom.lyricsBox.style.setProperty("--practice-lyrics-pad-x", `${candidate.padX}px`);
  dom.lyricsBox.style.setProperty("--practice-lyrics-row-gap", `${candidate.rowGap}px`);
}

function setPracticeLyricsDenseMode(enabled, options = {}) {
  const next = Boolean(enabled) && canUseDenseUntimedLyrics();
  if (app.practiceLyricsDense === next) return false;
  app.practiceLyricsDense = next;
  renderLyrics({ skipFitSchedule: options.skipFitSchedule });
  return true;
}

function measureLyricsOverflow() {
  return {
    height: Math.max(0, dom.lyricsBox.scrollHeight - dom.lyricsBox.clientHeight),
    width: Math.max(0, dom.lyricsBox.scrollWidth - dom.lyricsBox.clientWidth)
  };
}

function getMaxLyricsColumns(position, boxWidth, denseMode, metrics) {
  if (position === "top" || position === "bottom") {
    if (metrics.lineCount >= 110 && boxWidth >= 1500) return denseMode ? 5 : 4;
    if (metrics.lineCount >= 72 && boxWidth >= 1180) return denseMode ? 4 : 3;
    if (metrics.lineCount >= 42 && boxWidth >= 860) return 3;
    if (boxWidth >= 640) return 2;
    return 1;
  }
  if (metrics.lineCount >= 110 && boxWidth >= 980) return denseMode ? 3 : 2;
  if (metrics.lineCount >= 78 && boxWidth >= 720) return 2;
  return 1;
}

function getMaxLyricsFont(position, metrics, denseMode, boxWidth, boxHeight) {
  const sidePlacement = position === "left" || position === "right";
  let font = position === "top" || position === "bottom" ? 16 : 17;
  if (sidePlacement) {
    if (boxWidth >= 320) font += 0.5;
    if (boxWidth >= 380) font += 0.75;
    if (boxWidth >= 450) font += 1;
    if (boxWidth >= 520) font += 1;
    if (boxWidth >= 600) font += 0.5;
  } else {
    if (boxWidth >= 900) font += 0.5;
    if (boxWidth >= 1180) font += 0.5;
    if (boxWidth >= 1480) font += 0.75;
  }
  if (sidePlacement && boxWidth >= 360 && boxHeight >= 420) font += 0.5;
  if (sidePlacement && boxWidth >= 420 && metrics.lineCount <= 32) font += 0.5;
  if (sidePlacement && boxWidth >= 480 && metrics.lineCount <= 22) font += 0.5;
  if (boxHeight >= 220) font += 0.5;
  if (boxHeight >= 280) font += 0.75;
  if (boxHeight >= 360) font += 0.75;
  if (boxHeight >= 660) font += 0.5;
  if (boxHeight >= 800) font += 0.5;
  if (metrics.lineCount <= 14) font += 4;
  else if (metrics.lineCount <= 20) font += 3;
  else if (metrics.lineCount <= 28) font += 2;
  else if (metrics.lineCount <= 40) font += 1;
  if (metrics.lineCount > 110) font -= 3.5;
  else if (metrics.lineCount > 80) font -= 2.5;
  else if (metrics.lineCount > 55) font -= 1.5;
  if (metrics.longestLine > 60) font -= 2;
  else if (metrics.longestLine > 46) font -= 1.25;
  else if (metrics.longestLine > 32) font -= 0.5;
  if (denseMode) font -= 1.25;
  return clamp(font, denseMode ? 8 : 9, denseMode ? 19.5 : sidePlacement ? 25.5 : 24);
}

function isBetterLyricsFitCandidate(currentBest, nextCandidate, position) {
  if (!currentBest) return true;
  const sidePlacement = position === "left" || position === "right";
  const stackedPlacement = position === "top" || position === "bottom";
  const columnPenalty = sidePlacement ? 1.6 : stackedPlacement ? 0.95 : 0.6;
  const nextScore = nextCandidate.fontPx
    - (nextCandidate.columns - 1) * columnPenalty
    - (nextCandidate.denseMode ? 0.45 : 0);
  const bestScore = currentBest.fontPx
    - (currentBest.columns - 1) * columnPenalty
    - (currentBest.denseMode ? 0.45 : 0);

  if (nextScore !== bestScore) return nextScore > bestScore;
  if (nextCandidate.fontPx !== currentBest.fontPx) return nextCandidate.fontPx > currentBest.fontPx;
  if (nextCandidate.columns !== currentBest.columns) return nextCandidate.columns < currentBest.columns;
  if (nextCandidate.denseMode !== currentBest.denseMode) return !nextCandidate.denseMode && currentBest.denseMode;
  return false;
}

function fitLyricsToViewport() {
  if (app.screen !== "practice" || !app.practiceLyricsVisible || !dom.lyricsBox || !app.lyrics.length) {
    setPracticeLyricsDenseMode(false, { skipFitSchedule: true });
    clearLyricsFitStyles();
    return { fits: true, denseMode: false };
  }

  const boxWidth = dom.lyricsBox.clientWidth;
  const boxHeight = dom.lyricsBox.clientHeight;
  if (!boxWidth || !boxHeight) {
    return { fits: false, denseMode: app.practiceLyricsDense };
  }

  const position = normalizeLyricsPosition(app.practiceLayout.lyricsPosition);
  const metrics = getLyricsDensityMetrics();
  const modes = metrics.denseEligible ? [false, true] : [false];
  let best = null;

  for (const denseMode of modes) {
    setPracticeLyricsDenseMode(denseMode, { skipFitSchedule: true });
    const maxColumns = getMaxLyricsColumns(position, boxWidth, denseMode, metrics);
    const maxFontPx = getMaxLyricsFont(position, metrics, denseMode, boxWidth, boxHeight);
    const minFontPx = denseMode ? 6.5 : 8;

    for (let columns = 1; columns <= maxColumns; columns += 1) {
      for (let fontPx = maxFontPx; fontPx >= minFontPx; fontPx -= 0.5) {
        const candidate = createLyricsFitCandidate(fontPx, columns, denseMode, { position, boxWidth });
        applyLyricsFitCandidate(candidate);
        const overflow = measureLyricsOverflow();
        const overflowSum = overflow.height + overflow.width;
        const fits = overflow.height <= 1 && overflow.width <= 1;

        if (fits) {
          const betterFit = !best
            || !best.fits
            || isBetterLyricsFitCandidate(best.candidate, candidate, position);
          if (betterFit) {
            best = { fits: true, candidate, overflowSum };
          }
        } else if (!best || (!best.fits && overflowSum < best.overflowSum)) {
          best = { fits: false, candidate, overflowSum };
        }
      }
    }
  }

  if (!best) {
    setPracticeLyricsDenseMode(false, { skipFitSchedule: true });
    dom.lyricsBox.style.removeProperty("--practice-lyrics-font-size");
    return { fits: true, denseMode: false };
  }

  setPracticeLyricsDenseMode(best.candidate.denseMode, { skipFitSchedule: true });
  dom.lyricsBox.classList.toggle("denseLyrics", best.candidate.denseMode);
  applyLyricsFitCandidate(best.candidate);
  return { fits: best.fits, denseMode: best.candidate.denseMode };
}

function computeLyricsWidthRange(metrics, viewportWidth) {
  const ultraWide = viewportWidth >= 2200;
  const wide = viewportWidth >= 1700;
  const minWidth = metrics.timed ? 300 : 276;
  const maxCap = ultraWide
    ? (metrics.timed ? 660 : 620)
    : wide
      ? (metrics.timed ? 600 : 560)
      : viewportWidth >= 1280
        ? 520
        : 450;
  const idealWidth = clamp(
    Math.round(
      minWidth
      + Math.min(metrics.longestLine * (metrics.timed ? 2.15 : 1.35), metrics.timed ? 112 : 70)
      + Math.min(metrics.lineCount * (metrics.timed ? 0.45 : 0.24), metrics.timed ? 26 : 14)
      + Math.min(metrics.averageLine * 1.1, 24)
      + (ultraWide ? 36 : wide ? 22 : viewportWidth >= 1280 ? 12 : 0)
    ),
    minWidth,
    maxCap
  );
  return {
    min: clamp(idealWidth - 34, 250, idealWidth),
    max: clamp(idealWidth + (ultraWide ? 52 : wide ? 44 : 28), minWidth, maxCap)
  };
}

function computeLyricsHeightRange(metrics, availableHeight, position) {
  const topBottom = position === "top" || position === "bottom";
  if (topBottom) {
    const minHeight = metrics.timed ? 138 : 126;
    const maxCap = clamp(
      Math.round(Math.min(availableHeight * 0.38, metrics.lineCount > 84 ? 360 : 320)),
      180,
      metrics.lineCount > 84 ? 360 : 320
    );
    const idealHeight = clamp(
      Math.round(
        minHeight
        + Math.min(metrics.lineCount * (metrics.timed ? 0.95 : 0.62), metrics.timed ? 68 : 42)
        + Math.min(metrics.longestLine * 0.35, 18)
      ),
      minHeight,
      maxCap - 18
    );
    return {
      min: clamp(idealHeight - 24, 120, idealHeight),
      max: clamp(idealHeight + 24, minHeight, maxCap)
    };
  }

  const minHeight = metrics.timed ? 170 : 150;
  const idealHeight = clamp(
    Math.round(
      minHeight
      + Math.min(metrics.lineCount * (metrics.timed ? 1.8 : 1.2), metrics.timed ? 110 : 78)
      + Math.min(metrics.longestLine * 0.8, 38)
    ),
    minHeight,
    310
  );
  return {
    min: clamp(idealHeight - 48, 140, idealHeight),
    max: clamp(idealHeight + 42, minHeight, 360)
  };
}

function computePracticeLayoutForBalance(balance, viewportWidth, availableHeight) {
  const normalized = (balance - 34) / 40;
  const helperVisible = app.practiceHelperVisible;
  const lyricsVisible = app.practiceLyricsVisible;
  const lyricsPosition = normalizeLyricsPosition(app.practiceLayout.lyricsPosition);
  const metrics = getLyricsDensityMetrics();
  const wideEnoughForSides = viewportWidth >= 1180 && availableHeight >= 560;
  const wideEnoughForTopBottom = viewportWidth >= 980 && availableHeight >= 620;
  const sidePlacement = lyricsVisible && (lyricsPosition === "left" || lyricsPosition === "right") && wideEnoughForSides;
  const stackedPlacement = lyricsVisible && (lyricsPosition === "top" || lyricsPosition === "bottom") && wideEnoughForTopBottom;
  const mode = !lyricsVisible
    ? (helperVisible && wideEnoughForSides ? "split" : "stack")
    : sidePlacement
      ? "split"
      : (viewportWidth < 800 || availableHeight < 560 ? "compact" : "stack");

  let gridTemplateColumns = "minmax(0, 1fr)";
  let gridTemplateRows = "auto";
  let gridTemplateAreas = "\"stage\"";
  let stageWidth = Math.max(360, viewportWidth - 28);
  let playerMin = viewportWidth < 920 ? 200 : 236;
  let referenceLayout = lyricsVisible ? "stacked" : "hidden";
  let lyricsHeight = 0;
  let lyricsWidth = 0;

  if (!lyricsVisible) {
    const reservedTransport = 214;
    const videoHeightBudget = Math.max(190, availableHeight - reservedTransport - 24);
    const heightLimitedStage = Math.round(videoHeightBudget * (32 / 9) + 14);
    if (helperVisible && wideEnoughForSides) {
      const helperWidth = clamp(Math.round(viewportWidth * 0.17), 220, 260);
      const horizontalLimit = Math.max(620, viewportWidth - helperWidth - 52);
      stageWidth = Math.min(horizontalLimit, heightLimitedStage, 1700);
      gridTemplateColumns = `minmax(0, 1fr) minmax(${helperWidth}px, ${helperWidth}px)`;
      gridTemplateRows = "minmax(0, 1fr)";
      gridTemplateAreas = "\"stage helper\"";
      playerMin = viewportWidth < 1360 ? 216 : 248;
    } else if (helperVisible) {
      const horizontalLimit = Math.max(420, viewportWidth - 28);
      stageWidth = Math.min(horizontalLimit, heightLimitedStage);
      gridTemplateRows = "auto auto";
      gridTemplateAreas = "\"stage\" \"helper\"";
    } else {
      const horizontalLimit = Math.max(420, viewportWidth - 28);
      stageWidth = Math.min(horizontalLimit, heightLimitedStage);
    }
    return {
      mode,
      referenceLayout,
      gridTemplateColumns,
      gridTemplateRows,
      gridTemplateAreas,
      stageWidth,
      playerMin,
      lyricsHeight,
      lyricsWidth
    };
  }

  const reservedTransport = mode === "compact" ? 186 : 214;
  const reservedSizer = 96;

  if (sidePlacement) {
    const helperWidth = helperVisible ? clamp(Math.round(viewportWidth * 0.17), 220, 260) : 0;
    const widthRange = computeLyricsWidthRange(metrics, viewportWidth);
    lyricsWidth = clamp(
      Math.round(widthRange.max - normalized * (widthRange.max - widthRange.min)),
      widthRange.min,
      widthRange.max
    );
    const mainWidth = Math.max(880, viewportWidth - helperWidth - (helperVisible ? 52 : 24));
    const horizontalLimit = Math.max(560, mainWidth - lyricsWidth - 14);
    const videoHeightBudget = Math.max(210, availableHeight - reservedTransport - reservedSizer - 24);
    const heightLimitedStage = Math.round(videoHeightBudget * (32 / 9) + 14);
    const stageMin = Math.min(horizontalLimit, viewportWidth < 1440 ? 620 : 760);
    const stageCap = viewportWidth >= 2400 ? 2100 : viewportWidth >= 1800 ? 1860 : 1700;
    const stageMax = Math.max(stageMin, Math.min(horizontalLimit, heightLimitedStage, stageCap));

    stageWidth = Math.round(stageMin + normalized * (stageMax - stageMin));
    const spareWidth = Math.max(0, horizontalLimit - stageWidth);
    const comfortBoost = Math.min(
      Math.round(spareWidth * 0.22),
      Math.max(0, widthRange.max - lyricsWidth)
    );
    lyricsWidth = clamp(lyricsWidth + comfortBoost, widthRange.min, widthRange.max);
    playerMin = viewportWidth < 1360 ? 216 : 248;
    lyricsHeight = availableHeight;
    referenceLayout = "side";

    if (helperVisible) {
      gridTemplateColumns = lyricsPosition === "left"
        ? `minmax(0, 1fr) minmax(${lyricsWidth}px, ${lyricsWidth}px) minmax(${stageWidth}px, ${stageWidth}px) minmax(${helperWidth}px, ${helperWidth}px)`
        : `minmax(${stageWidth}px, ${stageWidth}px) minmax(${lyricsWidth}px, ${lyricsWidth}px) minmax(0, 1fr) minmax(${helperWidth}px, ${helperWidth}px)`;
      gridTemplateAreas = lyricsPosition === "left"
        ? "\". lyrics stage helper\""
        : "\"stage lyrics . helper\"";
    } else {
      gridTemplateColumns = lyricsPosition === "left"
        ? `minmax(0, 1fr) minmax(${lyricsWidth}px, ${lyricsWidth}px) minmax(${stageWidth}px, ${stageWidth}px)`
        : `minmax(${stageWidth}px, ${stageWidth}px) minmax(${lyricsWidth}px, ${lyricsWidth}px) minmax(0, 1fr)`;
      gridTemplateAreas = lyricsPosition === "left"
        ? "\". lyrics stage\""
        : "\"stage lyrics .\"";
    }
    gridTemplateRows = "minmax(0, 1fr)";
  } else if (stackedPlacement) {
    const helperWidth = helperVisible ? clamp(Math.round(viewportWidth * 0.16), 210, 250) : 0;
    const heightRange = computeLyricsHeightRange(metrics, availableHeight, lyricsPosition);
    lyricsHeight = clamp(
      Math.round(heightRange.max - normalized * (heightRange.max - heightRange.min)),
      heightRange.min,
      heightRange.max
    );
    const mainWidth = Math.max(700, viewportWidth - helperWidth - (helperVisible ? 52 : 24));
    const videoHeightBudget = Math.max(210, availableHeight - lyricsHeight - reservedTransport - reservedSizer - 32);
    const horizontalLimit = Math.max(560, mainWidth);
    const heightLimitedStage = Math.round(videoHeightBudget * (32 / 9) + 14);
    stageWidth = Math.min(horizontalLimit, heightLimitedStage, 1500);
    playerMin = viewportWidth < 1200 ? 220 : 248;
    referenceLayout = "wide";
    gridTemplateColumns = helperVisible
      ? `minmax(0, 1fr) minmax(${helperWidth}px, ${helperWidth}px)`
      : "minmax(0, 1fr)";
    if (lyricsPosition === "top") {
      gridTemplateRows = `${Math.max(160, lyricsHeight)}px minmax(0, 1fr)`;
      gridTemplateAreas = helperVisible
        ? "\"lyrics helper\" \"stage helper\""
        : "\"lyrics\" \"stage\"";
    } else {
      gridTemplateRows = `minmax(0, 1fr) ${Math.max(160, lyricsHeight)}px`;
      gridTemplateAreas = helperVisible
        ? "\"stage helper\" \"lyrics helper\""
        : "\"stage\" \"lyrics\"";
    }
  } else {
    const helperReserve = helperVisible ? (mode === "compact" ? 132 : 160) : 0;
    const heightRange = computeLyricsHeightRange(metrics, availableHeight, lyricsPosition);
    const targetLyricsHeight = clamp(
      Math.round(heightRange.max - normalized * (heightRange.max - heightRange.min)),
      mode === "compact" ? 140 : 190,
      mode === "compact" ? 250 : 340
    );
    const videoHeightBudget = Math.max(150, availableHeight - targetLyricsHeight - helperReserve - reservedTransport - reservedSizer - 42);
    const horizontalLimit = Math.max(420, viewportWidth - 28);
    const heightLimitedStage = Math.round(videoHeightBudget * (32 / 9) + 14);
    const stageMin = Math.min(horizontalLimit, mode === "compact" ? 480 : 620);
    const stageMax = Math.max(stageMin, Math.min(horizontalLimit, heightLimitedStage));

    stageWidth = Math.round(stageMin + normalized * (stageMax - stageMin));
    const videoHeight = estimatePracticeVideoHeight(stageWidth);
    lyricsHeight = clamp(
      availableHeight - videoHeight - helperReserve - reservedTransport - reservedSizer - 42,
      mode === "compact" ? 150 : 210,
      mode === "compact" ? 250 : 360
    );
    playerMin = mode === "compact" ? 200 : 236;
    referenceLayout = "stacked";
    gridTemplateColumns = "minmax(0, 1fr)";
    if (lyricsPosition === "left" || lyricsPosition === "top") {
      gridTemplateRows = helperVisible
        ? `${Math.max(150, lyricsHeight)}px auto auto`
        : `${Math.max(150, lyricsHeight)}px auto`;
      gridTemplateAreas = helperVisible
        ? "\"lyrics\" \"stage\" \"helper\""
        : "\"lyrics\" \"stage\"";
    } else {
      gridTemplateRows = helperVisible
        ? `auto ${Math.max(150, lyricsHeight)}px auto`
        : `auto ${Math.max(150, lyricsHeight)}px`;
      gridTemplateAreas = helperVisible
        ? "\"stage\" \"lyrics\" \"helper\""
        : "\"stage\" \"lyrics\"";
    }
  }

  return {
    mode,
    referenceLayout,
    gridTemplateColumns,
    gridTemplateRows,
    gridTemplateAreas,
    stageWidth,
    playerMin,
    lyricsHeight,
    lyricsWidth
  };
}

function applyComputedPracticeLayout(layout, availableHeight) {
  const lyricsPosition = normalizeLyricsPosition(app.practiceLayout.lyricsPosition);
  document.body.dataset.practiceLayout = layout.mode;
  document.body.dataset.practiceReferenceLayout = layout.referenceLayout;
  document.body.dataset.practiceLyricsPosition = lyricsPosition;
  document.body.dataset.practiceLyricsVisible = app.practiceLyricsVisible ? "visible" : "hidden";
  document.documentElement.style.setProperty("--practice-player-min", `${layout.playerMin}px`);
  if (layout.referenceLayout === "side" && app.practiceLyricsVisible) {
    dom.practiceStage.style.width = "100%";
    dom.practiceStage.style.maxWidth = `${Math.max(360, layout.stageWidth)}px`;
    dom.practiceStage.style.margin = "0";
    dom.practiceStage.style.justifySelf = "";
  } else {
    dom.practiceStage.style.width = "100%";
    dom.practiceStage.style.maxWidth = `${Math.max(360, layout.stageWidth)}px`;
    dom.practiceStage.style.margin = "0 auto";
    dom.practiceStage.style.justifySelf = "";
  }
  dom.playerSurface.style.gridTemplateColumns = layout.gridTemplateColumns;
  dom.playerSurface.style.gridTemplateRows = layout.gridTemplateRows;
  dom.playerSurface.style.gridTemplateAreas = layout.gridTemplateAreas;
  dom.playerSurface.style.minHeight = `${availableHeight}px`;
  if (app.practiceLyricsVisible) {
    dom.practiceReferenceRail.style.height = `${Math.max(140, layout.lyricsHeight)}px`;
    dom.lyricsSection.style.height = "100%";
  } else {
    dom.practiceReferenceRail.style.height = "";
    dom.lyricsSection.style.height = "";
  }
}

function scheduleLyricsFit() {
  if (lyricsFitFrame) cancelAnimationFrame(lyricsFitFrame);
  lyricsFitFrame = window.requestAnimationFrame(() => {
    lyricsFitFrame = 0;
    fitLyricsToViewport();
  });
}

function applyPracticeLayout(forceAuto = false) {
  if (app.screen !== "practice") {
    clearPracticeLayoutStyles();
    return;
  }

  const { viewportWidth, viewportHeight, availableHeight } = getPracticeViewportMetrics();
  const autoBalance = computeAutoPracticeBalance(viewportWidth, viewportHeight);
  app.practiceLayout.autoBalance = autoBalance;

  if (!app.practiceLayout.manual || forceAuto) {
    app.practiceLayout.balance = autoBalance;
    app.practiceLayout.manual = false;
  }

  const requestedBalance = clamp(Math.round(ensureNumber(app.practiceLayout.balance, autoBalance)), 34, 74);
  const lyricsVisible = app.practiceLyricsVisible;
  let appliedBalance = requestedBalance;
  let layout = computePracticeLayoutForBalance(appliedBalance, viewportWidth, availableHeight);
  let fitResult = { fits: true, denseMode: false };

  applyComputedPracticeLayout(layout, availableHeight);

  if (lyricsVisible && app.lyrics.length) {
    fitResult = fitLyricsToViewport();
    if (!fitResult.fits) {
      for (let candidate = requestedBalance - 1; candidate >= 34; candidate -= 1) {
        layout = computePracticeLayoutForBalance(candidate, viewportWidth, availableHeight);
        applyComputedPracticeLayout(layout, availableHeight);
        fitResult = fitLyricsToViewport();
        if (fitResult.fits) {
          appliedBalance = candidate;
          break;
        }
        appliedBalance = candidate;
      }
    }
  } else if (!lyricsVisible) {
    setPracticeLyricsDenseMode(false, { skipFitSchedule: true });
    clearLyricsFitStyles();
  }

  app.practiceLayout.balance = appliedBalance;
  app.practiceLayout.mode = layout.mode;
  app.practiceLayout.lyricsPosition = normalizeLyricsPosition(app.practiceLayout.lyricsPosition);
  dom.practiceStageBalance.value = String(appliedBalance);
  if (!lyricsVisible) {
    dom.practiceLayoutStatus.textContent = "Lyrics hidden. Full video focus.";
    dom.practiceLayoutBadge.textContent = "Video-only";
  } else {
    const clamped = appliedBalance !== requestedBalance;
    const statusBase = describePracticeLayout(layout.mode, appliedBalance, app.practiceLayout.manual);
    dom.practiceLayoutStatus.textContent = fitResult.fits
      ? (clamped ? `${statusBase} Lyrics kept fully visible.` : statusBase)
      : `${statusBase} Lyrics are compacted to the limit for this screen.`;
    dom.practiceLayoutBadge.textContent = getPracticeEmphasis(appliedBalance);
  }
  renderLyricsPositionControls();
}

function schedulePracticeResizeObserverReaction(action) {
  const nextAction = action === "layout" || practiceResizeObserverAction === "layout"
    ? "layout"
    : "fit";
  practiceResizeObserverAction = nextAction;
  if (practiceResizeObserverFrame) cancelAnimationFrame(practiceResizeObserverFrame);
  practiceResizeObserverFrame = window.requestAnimationFrame(() => {
    const pendingAction = practiceResizeObserverAction;
    practiceResizeObserverAction = "";
    practiceResizeObserverFrame = 0;
    if (app.screen !== "practice") return;
    if (pendingAction === "layout") schedulePracticeLayout();
    else if (app.practiceLyricsVisible) scheduleLyricsFit();
  });
}

function setupPracticeResizeObserver() {
  if (practiceResizeObserver || typeof ResizeObserver !== "function") return;
  practiceResizeObserver = new ResizeObserver((entries) => {
    let shouldLayout = false;
    let shouldFit = false;

    for (const entry of entries) {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (!width || !height) continue;
      const sizeKey = `${width}x${height}`;

      if (entry.target === dom.playerSurface && sizeKey !== lastObservedPlayerSurfaceSize) {
        lastObservedPlayerSurfaceSize = sizeKey;
        shouldLayout = true;
      } else if (entry.target === dom.practiceContextBar && sizeKey !== lastObservedContextBarSize) {
        lastObservedContextBarSize = sizeKey;
        shouldLayout = true;
      } else if (entry.target === dom.lyricsBox && sizeKey !== lastObservedLyricsBoxSize) {
        lastObservedLyricsBoxSize = sizeKey;
        shouldFit = true;
      }
    }

    if (shouldLayout) schedulePracticeResizeObserverReaction("layout");
    else if (shouldFit) schedulePracticeResizeObserverReaction("fit");
  });

  practiceResizeObserver.observe(dom.playerSurface);
  practiceResizeObserver.observe(dom.practiceContextBar);
  practiceResizeObserver.observe(dom.lyricsBox);
}

function schedulePracticeLayout(forceAuto = false) {
  if (practiceLayoutFrame) cancelAnimationFrame(practiceLayoutFrame);
  practiceLayoutFrame = window.requestAnimationFrame(() => {
    practiceLayoutFrame = 0;
    applyPracticeLayout(forceAuto);
  });
}

function pausePlayback() {
  cancelCountdown();
  if (songPlayer?.pauseVideo) songPlayer.pauseVideo();
  if (pianoPlayer?.pauseVideo) pianoPlayer.pauseVideo();
  setSyncing(false);
}

function resetPlayers() {
  pausePlayback();
  readySong = false;
  readyPiano = false;
  duration = 0;
  app.diagnostics = { driftMs: 0, corrections: 0, bufferingEvents: 0, loopCycles: 0 };
  if (songPlayer?.destroy) songPlayer.destroy();
  if (pianoPlayer?.destroy) pianoPlayer.destroy();
  songPlayer = null;
  pianoPlayer = null;
  enableTransport(false);
  renderDiagnostics();
  setTransportTime(0);
  setPlayerStatus("song", "idle");
  setPlayerStatus("piano", "idle");
  setCalibrateStatus("");
  updateMuteIcon();
}

function renderShell() {
  document.body.dataset.screen = app.screen;
  dom.navLobbyBtn.classList.toggle("active", app.screen === "lobby");
  dom.navWorkspaceBtn.classList.toggle("active", app.screen === "workspace");
  dom.practiceModeBtn.textContent = "Open fullscreen practice";
  renderCreateActions();
  renderPracticeContext();
  renderLyricsPositionControls();
  renderPracticeHelperVisibility();
  renderPracticeLyricsVisibility();
  schedulePracticeLayout();
}

function setScreen(nextScreen, options = {}) {
  let target = nextScreen;
  if (target === "workspace" && !canAccessWorkspace()) target = "lobby";
  if (target === "practice" && !hasPracticeCandidate()) {
    target = canAccessWorkspace() ? "workspace" : "lobby";
  }

  if (target === "practice") {
    app.returnScreen = options.returnScreen || (app.screen === "workspace" ? "workspace" : "lobby");
    if (app.screen !== "practice") app.practiceLayout.manual = false;
  }

  if (target === "lobby") {
    pausePlayback();
  }

  app.screen = target;
  renderShell();

  if (target === "practice") {
    if (options.requestFullscreen && document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  } else if (document.exitFullscreen && document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}

function createSongThumb(label, imageUrl, title) {
  const thumb = document.createElement("div");
  thumb.className = "songThumb";
  if (imageUrl) {
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = imageUrl;
    img.alt = `${title} ${label} thumbnail`;
    thumb.appendChild(img);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "songThumbFallback";
    fallback.textContent = label;
    thumb.appendChild(fallback);
  }
  const badge = document.createElement("span");
  badge.className = "songThumbLabel";
  badge.textContent = label;
  thumb.appendChild(badge);
  return thumb;
}

function applySettingsToInputs() {
  const settings = app.settings;
  dom.autoPracticeOnPlay.value = String(Boolean(settings.autoEnterPracticeOnPlay));
  dom.showPracticeShortcutLegend.value = String(Boolean(settings.showPracticeShortcutLegend));
  dom.markerRetargetThreshold.value = String(round2(settings.markerRetargetThresholdSec));
  dom.keyPlayPause.value = settings.shortcuts.playPause;
  dom.keyRestart.value = settings.shortcuts.restart;
  dom.keyMute.value = settings.shortcuts.mute;
  dom.keyLyricsFocus.value = settings.shortcuts.lyricsFocus;
  dom.keyPracticeMode.value = settings.shortcuts.practiceMode;
  dom.keyMetronomeToggle.value = settings.shortcuts.metronomeToggle;
  dom.keyToggleShortcutLegend.value = settings.shortcuts.toggleShortcutLegend;
  dom.keyCaptureMarker.value = settings.shortcuts.captureMarker;
  dom.markerThresholdHint.textContent = `Capture moves the nearest label within ${round2(settings.markerRetargetThresholdSec)} seconds.`;
  app.practiceHelperVisible = Boolean(settings.showPracticeShortcutLegend);
  renderPracticeHelperVisibility();
}

function readSettingsFromInputs() {
  return normalizeSettings({
    themeMode: document.body.dataset.themeMode || "system",
    autoEnterPracticeOnPlay: dom.autoPracticeOnPlay.value === "true",
    showPracticeShortcutLegend: dom.showPracticeShortcutLegend.value === "true",
    markerRetargetThresholdSec: ensureNumber(dom.markerRetargetThreshold.value, 5),
    shortcuts: {
      playPause: dom.keyPlayPause.value,
      restart: dom.keyRestart.value,
      mute: dom.keyMute.value,
      lyricsFocus: dom.keyLyricsFocus.value,
      practiceMode: dom.keyPracticeMode.value,
      metronomeToggle: dom.keyMetronomeToggle.value,
      toggleShortcutLegend: dom.keyToggleShortcutLegend.value,
      captureMarker: dom.keyCaptureMarker.value
    }
  });
}

function applySettings(settings, persistLocal = true) {
  app.settings = normalizeSettings(settings);
  applySettingsToInputs();
  applyTheme(app.settings.themeMode, persistLocal);
  renderPracticeHelper();
  renderShortcutsModal();
  if (persistLocal) safeSet(STORAGE_KEYS.settings, JSON.stringify(app.settings));
}

function populateSectionShortcutOptions() {
  dom.sectionShortcut.innerHTML = "";
  for (const key of SECTION_SHORTCUT_KEYS) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key || "None";
    dom.sectionShortcut.appendChild(option);
  }
}

function normalizeMarker(raw, idx = 0) {
  if (!raw) return null;
  const label = String(raw.label || raw.name || "").trim() || `Label ${idx + 1}`;
  return {
    id: String(raw.id || genId("marker")).trim(),
    label,
    masterTimeSec: Math.max(0, ensureNumber(raw.masterTimeSec ?? raw.timeSec ?? 0, 0))
  };
}

function normalizeSection(raw, idx = 0) {
  if (!raw) return null;
  const startSec = Math.max(0, ensureNumber(raw.startSec, 0));
  let endSec = raw.endSec == null || raw.endSec === "" ? null : Math.max(0, ensureNumber(raw.endSec, 0));
  if (endSec != null && endSec <= startSec) endSec = null;
  const shortcut = normalizeShortcutValue(raw.shortcut || "", "");
  return {
    id: String(raw.id || genId("section")).trim(),
    name: String(raw.name || "").trim() || `Section ${idx + 1}`,
    color: /^#[0-9a-f]{6}$/i.test(String(raw.color || "")) ? String(raw.color) : "#4f8cff",
    startSec,
    endSec,
    repeatCount: Math.max(0, Math.floor(ensureNumber(raw.repeatCount, 4))),
    shortcut: SECTION_SHORTCUT_KEYS.includes(shortcut) ? shortcut : ""
  };
}

function sortMarkers() {
  app.markers.sort((a, b) => a.masterTimeSec - b.masterTimeSec);
}

function sortSections() {
  app.sections.sort((a, b) => a.startSec - b.startSec);
}

function renderLobby() {
  dom.lobbyGrid.innerHTML = "";
  const filter = app.searchTerm.trim().toLowerCase();
  const visibleSongs = app.songs.filter((song) => {
    if (!filter) return true;
    return [song.title, song.artist, song.summary, song.description, song.ownerDisplayName]
      .join(" ")
      .toLowerCase()
      .includes(filter);
  });

  if (!visibleSongs.length) {
    const empty = document.createElement("div");
    empty.className = "songCard";
    empty.innerHTML = `<h3>No songs found</h3><p class="muted">${canCreateSongs()
      ? "Try a different search, or start a fresh sync in your workspace."
      : "Try a different search, or log in if you want to create your own sync."
    }</p>`;
    dom.lobbyGrid.appendChild(empty);
    return;
  }

  for (const song of visibleSongs) {
    const card = document.createElement("article");
    card.className = "songCard";
    const media = document.createElement("div");
    media.className = "songCardMedia";
    media.append(
      createSongThumb("Official video", getYouTubeThumbnail(song.officialClipUrl), song.title),
      createSongThumb("Tutorial", getYouTubeThumbnail(song.tutorialUrl), song.title)
    );

    const cardBadge = document.createElement("span");
    cardBadge.className = "songCardBadge";
    cardBadge.textContent = song.canEdit ? "Editable by you" : "Practice ready";
    media.appendChild(cardBadge);

    const copy = document.createElement("div");
    copy.innerHTML = `
      <p class="eyebrow">${escapeHtml(song.artist)}</p>
      <h3>${escapeHtml(song.title)}</h3>
    `;

    const creator = document.createElement("p");
    creator.className = "songCreator";
    creator.textContent = `Created by ${song.ownerDisplayName || "sync.tvguitar.com"}`;

    const summary = document.createElement("p");
    summary.className = "muted";
    summary.textContent = song.summary || "Practice sync ready for the dual-player workspace.";

    const meta = document.createElement("div");
    meta.className = "songMetaRow";
    meta.innerHTML = `
      <span class="pill">${song.markerCount} labels</span>
      <span class="pill">${song.sectionCount} sections</span>
      <span class="pill">${song.canEdit ? "Workspace access" : "Practice only"}</span>
    `;

    const actions = document.createElement("div");
    actions.className = "songCardActions";

    const practiceBtn = document.createElement("button");
    practiceBtn.className = "primary";
    practiceBtn.type = "button";
    practiceBtn.textContent = "Practice now";
    practiceBtn.addEventListener("click", () => practiceSong(song.id));

    actions.appendChild(practiceBtn);
    if (song.canEdit) {
      const editBtn = document.createElement("button");
      editBtn.className = "secondary";
      editBtn.type = "button";
      editBtn.textContent = "Edit workspace";
      editBtn.addEventListener("click", () => openSongWorkspace(song.id));
      actions.appendChild(editBtn);
    }

    card.append(media, copy, creator, summary, meta, actions);
    dom.lobbyGrid.appendChild(card);
  }
}

function applySongToForm(song) {
  app.currentSongId = song.id || "";
  app.currentSongCanEdit = Boolean(song.canEdit);
  app.currentSongOwner = song.ownerDisplayName || "";
  dom.songTitle.value = song.title || "";
  dom.songArtist.value = song.artist || "";
  dom.songSummary.value = song.summary || "";
  dom.songUrl.value = song.officialClipUrl || "";
  dom.pianoUrl.value = song.tutorialUrl || "";
  dom.songOffset.value = String(round2(song.songStartSec || 0));
  dom.pianoOffset.value = String(round2(song.tutorialStartSec || 0));
  dom.countdownSec.value = String(song.countdownSec ?? 4);
  dom.publishSongToggle.value = String(song.published !== false);
  dom.metronomeBpm.value = String(song.metronomeBpm ?? 92);
  dom.metronomeBeatsPerBar.value = String(song.metronomeBeatsPerBar ?? 4);
  dom.lyricsPaste.value = song.lyrics || "";
  app.lyrics = dom.lyricsPaste.value.trim() ? parseLRC(dom.lyricsPaste.value.trim()) : [];
  app.practiceLyricsDense = false;
  app.markers = Array.isArray(song.markers) ? song.markers.map(normalizeMarker).filter(Boolean) : [];
  app.sections = Array.isArray(song.sections) ? song.sections.map(normalizeSection).filter(Boolean) : [];
  sortMarkers();
  sortSections();
  renderLyrics();
  renderMarkersList();
  renderSectionsList();
  renderPracticeHelper();
  renderShortcutsModal();
  renderEditorHeader(song);
  renderShell();
  readOffsets();
  metronome.setBpm(ensureNumber(dom.metronomeBpm.value, 92));
  metronome.setBeatsPerBar(ensureNumber(dom.metronomeBeatsPerBar.value, 4));
}

function renderEditorHeader(song = null) {
  if (song) {
    dom.workspaceTitle.textContent = `${song.artist || "Artist"} — ${song.title || "Untitled song"}`;
    const canEdit = canEditCurrentSong();
    dom.editorModeBadge.textContent = canEdit ? "Owner workspace" : "Practice only";
    if (canEdit) {
      setEditorStatus("This is your song. Tweak the sync here, then save when it feels right.");
      dom.saveSongBtn.disabled = false;
      dom.saveSongBtn.textContent = "Save changes";
    } else {
      setEditorStatus("This song opens in practice mode for everyone else. Only its creator can edit the workspace.");
      dom.saveSongBtn.disabled = true;
      dom.saveSongBtn.textContent = "Owner only";
    }
    return;
  }

  dom.workspaceTitle.textContent = canCreateSongs()
    ? "New song draft"
    : "Log in to create songs";
  dom.editorModeBadge.textContent = canCreateSongs() ? "Draft workspace" : "Lobby only";
  setEditorStatus(canCreateSongs()
    ? "Build a new sync song here, then load the videos and publish when it feels right."
    : "Guests can browse and practice public songs from the lobby. Log in to add or edit songs.");
  dom.saveSongBtn.disabled = !canCreateSongs();
  dom.saveSongBtn.textContent = "Publish song";
}

function renderProfile() {
  dom.profileNameText.textContent = app.profile?.displayName || app.session?.user?.displayName || app.session?.user?.email || "Guest";
  dom.profileEmailText.textContent = app.profile?.email || "";
  const confirmationMatches = dom.deleteAccountConfirmInput.value.trim() === DELETE_ACCOUNT_CONFIRMATION;
  dom.deleteAccountBtn.disabled = !app.profile?.deletionEnabled || !confirmationMatches;
  if (!app.profile?.deletionEnabled) {
    dom.deleteAccountStatus.textContent = "Account deletion is unavailable right now.";
    return;
  }
  if (!dom.deleteAccountStatus.textContent) {
    dom.deleteAccountStatus.textContent = `Deleting your account removes your profile, sessions, and sign-in records, deletes unpublished drafts, and anonymizes any published songs that remain public. Type ${DELETE_ACCOUNT_CONFIRMATION} exactly, then confirm the dialog.`;
  }
}

function renderMySongs() {
  dom.mySongsList.innerHTML = "";
  if (!app.session?.user) {
    dom.mySongsList.textContent = "Log in to see your songs.";
    return;
  }
  if (!app.mySongs.length) {
    dom.mySongsList.textContent = "No published or draft songs yet.";
    return;
  }
  for (const song of app.mySongs) {
    const row = document.createElement("div");
    row.className = "markerRow";
    row.innerHTML = `
      <div class="markerMeta">
        <strong>${escapeHtml(song.title)}</strong>
        <span class="muted">${escapeHtml(song.artist)} · ${song.published ? "Published" : "Hidden draft"}</span>
      </div>
    `;
    const actions = document.createElement("div");
    actions.className = "markerActions";
    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.textContent = "Workspace";
    openBtn.addEventListener("click", () => {
      closeModal(dom.profileModal);
      openSongWorkspace(song.id);
    });
    actions.appendChild(openBtn);
    row.appendChild(actions);
    dom.mySongsList.appendChild(row);
  }
}

function renderMarkersList() {
  dom.markersList.innerHTML = "";
  if (!app.markers.length) {
    dom.markersList.textContent = "No labels yet.";
    renderPracticeHelper();
    renderShortcutsModal();
    return;
  }

  const assignments = getMarkerJumpAssignments();
  for (const marker of app.markers) {
    const row = document.createElement("div");
    row.className = "markerRow";
    const jumpKey = assignments.get(marker.id) || "—";
    const meta = document.createElement("div");
    meta.className = "markerMeta";
    meta.innerHTML = `
      <strong>${escapeHtml(marker.label)}</strong>
      <span class="muted">${fmtTime(marker.masterTimeSec)} · jump ${escapeHtml(jumpKey)}</span>
    `;
    const actions = document.createElement("div");
    actions.className = "markerActions";

    const jumpBtn = document.createElement("button");
    jumpBtn.type = "button";
    jumpBtn.textContent = "Jump";
    jumpBtn.addEventListener("click", () => jumpToMarker(marker.id));

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      dom.markerName.value = marker.label;
      dom.markerTime.value = String(round2(marker.masterTimeSec));
      dom.markerName.dataset.editId = marker.id;
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      app.markers = app.markers.filter((item) => item.id !== marker.id);
      renderMarkersList();
      scheduleAutosave();
    });

    actions.append(jumpBtn, editBtn, deleteBtn);
    row.append(meta, actions);
    dom.markersList.appendChild(row);
  }
  renderPracticeHelper();
  renderShortcutsModal();
}

function renderSectionsList() {
  dom.sectionsList.innerHTML = "";
  if (!app.sections.length) {
    dom.sectionsList.textContent = "No sections yet.";
    renderPracticeHelper();
    renderShortcutsModal();
    return;
  }
  for (const section of app.sections) {
    const row = document.createElement("div");
    row.className = "markerRow";
    const endText = section.endSec == null ? "end" : fmtTime(section.endSec);
    const meta = document.createElement("div");
    meta.className = "markerMeta";
    meta.innerHTML = `
      <div><span class="sectionChip" style="background:${escapeHtml(section.color)}"></span><strong>${escapeHtml(section.name)}</strong></div>
      <span class="muted">${fmtTime(section.startSec)} → ${endText}${section.shortcut ? ` · ${escapeHtml(section.shortcut)}` : ""}</span>
    `;
    const actions = document.createElement("div");
    actions.className = "markerActions";

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.textContent = "Play";
    playBtn.addEventListener("click", () => playSection(section, false));

    const loopBtn = document.createElement("button");
    loopBtn.type = "button";
    loopBtn.textContent = "Loop";
    loopBtn.disabled = section.endSec == null;
    loopBtn.addEventListener("click", () => playSection(section, true));

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      dom.sectionName.value = section.name;
      dom.sectionName.dataset.editId = section.id;
      dom.sectionColor.value = section.color;
      dom.sectionStart.value = String(round2(section.startSec));
      dom.sectionEnd.value = section.endSec == null ? "" : String(round2(section.endSec));
      dom.sectionRepeat.value = String(section.repeatCount);
      dom.sectionShortcut.value = section.shortcut || "";
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      app.sections = app.sections.filter((item) => item.id !== section.id);
      renderSectionsList();
      scheduleAutosave();
    });

    actions.append(playBtn, loopBtn, editBtn, deleteBtn);
    row.append(meta, actions);
    dom.sectionsList.appendChild(row);
  }
  renderPracticeHelper();
  renderShortcutsModal();
}

function getMarkerJumpAssignments() {
  const reserved = new Set([
    app.settings.shortcuts.playPause,
    app.settings.shortcuts.restart,
    app.settings.shortcuts.mute,
    app.settings.shortcuts.lyricsFocus,
    app.settings.shortcuts.practiceMode,
    app.settings.shortcuts.metronomeToggle,
    app.settings.shortcuts.toggleShortcutLegend,
    app.settings.shortcuts.captureMarker
  ].map((value) => String(value || "").toUpperCase()).filter(Boolean));

  for (const section of app.sections) {
    if (section.shortcut) reserved.add(section.shortcut.toUpperCase());
  }

  const assignments = new Map();
  const usable = MARKER_JUMP_POOL.filter((key) => !reserved.has(key.toUpperCase()));
  app.markers.forEach((marker, idx) => {
    if (usable[idx]) assignments.set(marker.id, usable[idx]);
  });
  return assignments;
}

function renderPracticeHelper() {
  renderPracticeHelperVisibility();
  const shortcutRows = [
    { key: app.settings.shortcuts.playPause, action: "Play / pause" },
    { key: app.settings.shortcuts.restart, action: "Restart" },
    { key: app.settings.shortcuts.mute, action: "Mute tutorial" },
    { key: app.settings.shortcuts.metronomeToggle, action: "Metronome" },
    { key: app.settings.shortcuts.captureMarker, action: "Capture / retarget label" },
    { key: app.settings.shortcuts.toggleShortcutLegend, action: "Show / hide helper" },
    { key: app.settings.shortcuts.practiceMode, action: "Fullscreen practice" },
    { key: "Left / Right", action: "Seek 5 seconds" }
  ];

  dom.practiceShortcutSummary.innerHTML = "";
  for (const row of shortcutRows) {
    const item = document.createElement("div");
    item.className = "shortcutRow";
    item.innerHTML = `<strong>${escapeHtml(row.key)}</strong><span>${escapeHtml(row.action)}</span>`;
    dom.practiceShortcutSummary.appendChild(item);
  }

  dom.markerJumpLegend.innerHTML = "";
  const assignments = getMarkerJumpAssignments();
  if (!assignments.size) {
    dom.markerJumpLegend.textContent = "No labels assigned yet.";
    return;
  }
  for (const marker of app.markers) {
    const key = assignments.get(marker.id);
    if (!key) continue;
    const row = document.createElement("div");
    row.className = "markerJumpRow";
    row.innerHTML = `<strong>${escapeHtml(key)}</strong><span>${escapeHtml(marker.label)} · ${fmtTime(marker.masterTimeSec)}</span>`;
    dom.markerJumpLegend.appendChild(row);
  }
}

function renderPracticeHelperVisibility() {
  const shouldHideHelper = app.screen === "practice" && !app.practiceHelperVisible;
  document.body.dataset.practiceHelperVisible = app.practiceHelperVisible ? "visible" : "hidden";
  dom.practiceHelperSection.classList.toggle("hidden", shouldHideHelper);
  dom.togglePracticeHelperBtn.classList.toggle("hidden", app.screen !== "practice");
  dom.togglePracticeHelperBtn.textContent = app.practiceHelperVisible ? "Hide helper" : "Show helper";
  schedulePracticeLayout();
}

function renderPracticeLyricsVisibility() {
  const shouldHideLyrics = app.screen === "practice" && !app.practiceLyricsVisible;
  document.body.dataset.practiceLyricsVisible = app.practiceLyricsVisible ? "visible" : "hidden";
  dom.practiceReferenceRail.classList.toggle("hidden", shouldHideLyrics);
  dom.practiceStageSizer.classList.toggle("hidden", app.screen !== "practice" || shouldHideLyrics);
  dom.lyricsFocusBtn.classList.toggle("hidden", shouldHideLyrics);
  dom.togglePracticeLyricsBtn.classList.toggle("hidden", app.screen !== "practice");
  dom.togglePracticeLyricsBtn.textContent = app.practiceLyricsVisible ? "Hide lyrics" : "Show lyrics";
  if (shouldHideLyrics) {
    document.body.classList.remove("lyrics-focus");
    setPracticeLyricsDenseMode(false, { skipFitSchedule: true });
    clearLyricsFitStyles();
  }
  schedulePracticeLayout();
}

function renderShortcutsModal() {
  dom.shortcutsList.innerHTML = "";
  const rows = [
    { key: app.settings.shortcuts.playPause, action: "Play or pause both videos" },
    { key: app.settings.shortcuts.restart, action: "Restart from the beginning" },
    { key: app.settings.shortcuts.mute, action: "Mute tutorial" },
    { key: app.settings.shortcuts.lyricsFocus, action: "Expand lyrics focus" },
    { key: app.settings.shortcuts.practiceMode, action: "Toggle fullscreen practice" },
    { key: app.settings.shortcuts.metronomeToggle, action: "Toggle metronome" },
    { key: app.settings.shortcuts.toggleShortcutLegend, action: "Show or hide practice helper" },
    { key: app.settings.shortcuts.captureMarker, action: "Capture or retarget a timeline label" }
  ];

  const assignments = getMarkerJumpAssignments();
  if (assignments.size) {
    rows.push({
      key: "Jump keys",
      action: app.markers.map((marker) => `${assignments.get(marker.id) || "—"} → ${marker.label}`).join(" | ")
    });
  }

  for (const row of rows) {
    const item = document.createElement("div");
    item.className = "shortcutRow";
    item.innerHTML = `<strong>${escapeHtml(row.key)}</strong><span>${escapeHtml(row.action)}</span>`;
    dom.shortcutsList.appendChild(item);
  }
}

function renderLyrics(options = {}) {
  const skipFitSchedule = Boolean(options.skipFitSchedule);
  const denseMode = app.practiceLyricsDense && canUseDenseUntimedLyrics();
  app.practiceLyricsDense = denseMode;
  dom.lyricsBox.innerHTML = "";
  dom.lyricsBox.classList.toggle("denseLyrics", denseMode);
  if (!app.lyrics.length) {
    dom.lyricsBox.innerHTML = '<div class="small muted">No lyrics loaded yet.</div>';
    clearLyricsFitStyles();
    if (!skipFitSchedule) scheduleLyricsFit();
    return;
  }

  const renderedLines = getRenderedLyricsLines();
  for (const [idx, line] of renderedLines.entries()) {
    const div = document.createElement("div");
    div.className = "line";
    div.dataset.idx = String(idx);
    div.textContent = (line.t != null ? `[${fmtTime(line.t)}] ` : "") + line.content;
    dom.lyricsBox.appendChild(div);
  }
  lastActiveLyricIndex = -1;
  if (!skipFitSchedule) scheduleLyricsFit();
}

function setActiveLyricByTime(timeSec) {
  if (!app.lyrics.length || app.lyrics[0]?.t == null) return;
  let answer = -1;
  let lo = 0;
  let hi = app.lyrics.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (app.lyrics[mid].t <= timeSec) {
      answer = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (answer < 0) answer = 0;
  if (answer === lastActiveLyricIndex) return;
  dom.lyricsBox.querySelector(".line.active")?.classList.remove("active");
  const current = dom.lyricsBox.querySelector(`.line[data-idx="${answer}"]`);
  if (current) {
    current.classList.add("active");
    if (app.screen !== "practice") {
      current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }
  lastActiveLyricIndex = answer;
}

function usePastedLyrics() {
  app.lyrics = dom.lyricsPaste.value.trim() ? parseLRC(dom.lyricsPaste.value.trim()) : [];
  app.practiceLyricsDense = false;
  renderLyrics();
  if (canSync()) setActiveLyricByTime(getMasterTime());
  scheduleAutosave();
}

function collectSongPayload() {
  return {
    title: dom.songTitle.value.trim(),
    artist: dom.songArtist.value.trim(),
    summary: dom.songSummary.value.trim(),
    description: "",
    officialClipUrl: dom.songUrl.value.trim(),
    tutorialUrl: dom.pianoUrl.value.trim(),
    songStartSec: ensureNumber(dom.songOffset.value, 0),
    tutorialStartSec: ensureNumber(dom.pianoOffset.value, 0),
    countdownSec: Math.max(0, Math.floor(ensureNumber(dom.countdownSec.value, 4))),
    metronomeBpm: Math.round(ensureNumber(dom.metronomeBpm.value, 92)),
    metronomeBeatsPerBar: Math.round(ensureNumber(dom.metronomeBeatsPerBar.value, 4)),
    loopRepeatTarget: Math.max(0, Math.floor(ensureNumber(dom.loopRepeats.value, 4))),
    lyrics: dom.lyricsPaste.value.trim(),
    markers: app.markers.map((marker) => ({
      id: marker.id,
      label: marker.label,
      masterTimeSec: round2(marker.masterTimeSec)
    })),
    sections: app.sections.map((section) => ({
      id: section.id,
      name: section.name,
      color: section.color,
      startSec: round2(section.startSec),
      endSec: section.endSec == null ? null : round2(section.endSec),
      repeatCount: section.repeatCount,
      shortcut: section.shortcut
    })),
    published: dom.publishSongToggle.value === "true"
  };
}

async function saveCurrentSong() {
  if (!app.session?.user) {
    showToast("Log in to publish or update songs.", "danger");
    openAuthModal("login");
    return;
  }
  if (app.currentSongId && !app.currentSongCanEdit) {
    showToast("Only the creator can edit this song. Start a new draft to build your own sync.", "danger");
    return;
  }

  const payload = collectSongPayload();
  const wasEditing = Boolean(app.currentSongId && app.currentSongCanEdit);
  try {
    const song = app.currentSongId && app.currentSongCanEdit
      ? await apiFetch(`/api/me/songs/${app.currentSongId}`, { method: "PUT", body: JSON.stringify(payload) })
      : await apiFetch("/api/me/songs", { method: "POST", body: JSON.stringify(payload) });
    applySongToForm(song);
    await Promise.all([loadLobbySongs(), loadMySongs()]);
    renderProfile();
    renderMySongs();
    setScreen("workspace");
    showToast(wasEditing ? "Song changes saved." : "Song published to the lobby.", "success");
  } catch (error) {
    showToast(error.message, "danger");
  }
}

async function loadLobbySongs() {
  try {
    app.songs = await apiFetch("/api/songs", { method: "GET" });
    renderLobby();
  } catch (error) {
    setBootstrapStatus(error.message);
    showToast(error.message, "danger");
  }
}

async function loadMySongs() {
  if (!app.session?.user) {
    app.mySongs = [];
    renderMySongs();
    return;
  }
  try {
    app.mySongs = await apiFetch("/api/me/songs", { method: "GET" });
    renderMySongs();
  } catch (error) {
    app.mySongs = [];
    renderMySongs();
    showToast(error.message, "danger");
  }
}

async function loadSong(songId, options = {}) {
  try {
    const song = await apiFetch(`/api/songs/${songId}`, { method: "GET" });
    applySongToForm(song);
    if (!options.silent) showToast(`Loaded ${song.artist} — ${song.title}.`, "success");
    return song;
  } catch (error) {
    if (!options.silent) showToast(error.message, "danger");
    return null;
  }
}

function createNewDraft(skipAuthCheck = false, options = {}) {
  if (!skipAuthCheck && !canCreateSongs()) {
    showToast("Log in to add songs or edit your own workspace.", "danger");
    openAuthModal("login");
    return;
  }

  resetPlayers();
  clearLoop();
  app.currentSongId = "";
  app.currentSongCanEdit = false;
  app.currentSongOwner = "";
  dom.songTitle.value = "";
  dom.songArtist.value = "";
  dom.songSummary.value = "";
  dom.songUrl.value = "";
  dom.pianoUrl.value = "";
  dom.songOffset.value = "0";
  dom.pianoOffset.value = "0";
  dom.countdownSec.value = "4";
  dom.publishSongToggle.value = "true";
  dom.metronomeBpm.value = "92";
  dom.metronomeBeatsPerBar.value = "4";
  dom.loopRepeats.value = "4";
  dom.lyricsPaste.value = "";
  dom.exportOutput.value = "";
  app.lyrics = [];
  app.practiceLyricsDense = false;
  app.markers = [];
  app.sections = [];
  dom.markerName.value = "";
  dom.markerName.dataset.editId = "";
  dom.markerTime.value = "0";
  dom.sectionName.value = "";
  dom.sectionName.dataset.editId = "";
  dom.sectionColor.value = "#4f8cff";
  dom.sectionStart.value = "0";
  dom.sectionEnd.value = "";
  dom.sectionRepeat.value = "4";
  dom.sectionShortcut.value = "";
  metronome.setBpm(92);
  metronome.setBeatsPerBar(4);
  readOffsets();
  renderLyrics();
  renderMarkersList();
  renderSectionsList();
  renderEditorHeader();
  setScreen(options.screen || "workspace");
  renderShell();
  if (!options.quiet) showToast("Workspace ready for a new song.", "success");
}

async function openSongWorkspace(songId) {
  const song = await loadSong(songId, { silent: true });
  if (!song) return;
  if (!song.canEdit) {
    showToast("Only the creator can open this song in the workspace.", "danger");
    return;
  }

  setScreen("workspace");
  const started = await loadPlayers({
    readyToast: `Videos ready for ${song.artist} — ${song.title}.`
  });
  if (started) showToast(`Workspace opened for ${song.artist} — ${song.title}.`, "success");
}

async function practiceSong(songId) {
  app.returnScreen = app.screen === "workspace" ? "workspace" : "lobby";
  dom.practiceSongTitle.textContent = "Loading practice…";
  dom.practiceSongMeta.textContent = "Fetching the song and lining up both videos.";

  const song = await loadSong(songId, { silent: true });
  if (!song) {
    setScreen("lobby");
    return;
  }

  setScreen("practice", { requestFullscreen: true, returnScreen: app.returnScreen });
  const started = await loadPlayers({
    readyToast: `Videos ready for ${song.artist} — ${song.title}. Press play when you are ready.`
  });
  if (started) showToast(`Opening practice for ${song.artist} — ${song.title}.`, "info");
}

function collectDraftState() {
  return {
    song: collectSongPayload(),
    markers: app.markers,
    sections: app.sections,
    settings: app.settings,
    currentSongId: app.currentSongId
  };
}

function scheduleAutosave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    safeSet(STORAGE_KEYS.draft, JSON.stringify(collectDraftState()));
  }, 250);
}

function restoreDraft() {
  const raw = safeGet(STORAGE_KEYS.draft, null);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    app.currentSongId = draft.currentSongId || "";
    app.currentSongCanEdit = false;
    if (draft.settings) applySettings(draft.settings, true);
    if (draft.song) {
      dom.songTitle.value = draft.song.title || "";
      dom.songArtist.value = draft.song.artist || "";
      dom.songSummary.value = draft.song.summary || "";
      dom.songUrl.value = draft.song.officialClipUrl || "";
      dom.pianoUrl.value = draft.song.tutorialUrl || "";
      dom.songOffset.value = String(draft.song.songStartSec ?? 0);
      dom.pianoOffset.value = String(draft.song.tutorialStartSec ?? 0);
      dom.countdownSec.value = String(draft.song.countdownSec ?? 4);
      dom.publishSongToggle.value = String(draft.song.published !== false);
      dom.metronomeBpm.value = String(draft.song.metronomeBpm ?? 92);
      dom.metronomeBeatsPerBar.value = String(draft.song.metronomeBeatsPerBar ?? 4);
      dom.loopRepeats.value = String(draft.song.loopRepeatTarget ?? 4);
      dom.lyricsPaste.value = draft.song.lyrics || "";
      app.lyrics = dom.lyricsPaste.value.trim() ? parseLRC(dom.lyricsPaste.value.trim()) : [];
      app.practiceLyricsDense = false;
      app.markers = Array.isArray(draft.markers) ? draft.markers.map(normalizeMarker).filter(Boolean) : [];
      app.sections = Array.isArray(draft.sections) ? draft.sections.map(normalizeSection).filter(Boolean) : [];
      renderLyrics();
      renderMarkersList();
      renderSectionsList();
      renderPracticeHelper();
      renderShortcutsModal();
    }
    renderEditorHeader(app.currentSongId ? {
      id: app.currentSongId,
      title: dom.songTitle.value,
      artist: dom.songArtist.value,
      canEdit: false
    } : null);
    renderShell();
  } catch {
    // Ignore bad drafts.
  }
}

function openModal(node) {
  node.classList.remove("hidden");
}

function closeModal(node) {
  node.classList.add("hidden");
}

function resetDeleteAccountForm() {
  dom.deleteAccountConfirmInput.value = "";
  dom.deleteAccountStatus.textContent = "";
}

function syncAuthModalState() {
  const signup = app.authMode === "signup";
  dom.authTabLogin.classList.toggle("active", !signup);
  dom.authTabSignup.classList.toggle("active", signup);
  dom.authDisplayNameField.classList.toggle("hidden", !signup);
  dom.authDisplayName.required = signup && emailAuthEnabled();
  dom.authDisplayName.disabled = !emailAuthEnabled();
  dom.authEmail.disabled = !emailAuthEnabled();
  dom.authSubmitBtn.disabled = !emailAuthEnabled();
  dom.authSubmitBtn.textContent = signup ? "Create by email" : "Send secure link";
  dom.authEmailHelp.textContent = emailAuthEnabled()
    ? signup
      ? "We will email a verification link. No password is stored on this site."
      : "We will email a one-tap sign-in link."
    : "Email sign-in is not configured on this server yet.";

  const showGoogle = googleAuthEnabled();
  dom.googleAuthSection.classList.toggle("hidden", !showGoogle);
  dom.authDivider.classList.toggle("hidden", !(emailAuthEnabled() && showGoogle));

  if (showGoogle) renderGoogleAuthButton();
}

function openAuthModal(mode) {
  app.authMode = mode;
  dom.authStatus.textContent = "";
  syncAuthModalState();
  openModal(dom.authModal);
  if (googleAuthEnabled() && !app.googleInitialized) {
    void initGoogleIdentity();
  }
  renderGoogleAuthButton();
}

function openProfileModal() {
  resetDeleteAccountForm();
  renderProfile();
  renderMySongs();
  openModal(dom.profileModal);
}

function loadGoogleIdentityClient() {
  if (!googleAuthEnabled()) return Promise.resolve(null);
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (googleIdentityPromise) return googleIdentityPromise;

  googleIdentityPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-google-identity='true']");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google sign-in failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.addEventListener("load", () => resolve(window.google), { once: true });
    script.addEventListener("error", () => reject(new Error("Google sign-in failed to load.")), { once: true });
    document.head.appendChild(script);
  });

  return googleIdentityPromise;
}

async function initGoogleIdentity() {
  if (!googleAuthEnabled()) {
    dom.googleAuthSection.classList.add("hidden");
    dom.authDivider.classList.add("hidden");
    return;
  }

  try {
    await loadGoogleIdentityClient();
    if (!window.google?.accounts?.id) {
      throw new Error("Google sign-in is unavailable right now.");
    }
    if (!app.googleInitialized) {
      window.google.accounts.id.initialize({
        client_id: app.bootstrap.auth.googleClientId,
        callback: (response) => {
          void handleGoogleCredential(response);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: "popup"
      });
      app.googleInitialized = true;
    }
    renderGoogleAuthButton();
  } catch (error) {
    dom.googleAuthSection.classList.add("hidden");
    dom.authDivider.classList.add("hidden");
    showToast(error.message, "danger");
  }
}

function renderGoogleAuthButton() {
  if (!dom.googleAuthButton) return;
  dom.googleAuthButton.innerHTML = "";
  if (!googleAuthEnabled() || !app.googleInitialized || !window.google?.accounts?.id) return;

  const width = Math.min(360, Math.max(240, dom.googleAuthButton.clientWidth || 320));
  window.google.accounts.id.renderButton(dom.googleAuthButton, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    width,
    logo_alignment: "left"
  });
}

async function handleGoogleCredential(response) {
  if (!response?.credential) {
    dom.authStatus.textContent = "Google did not return a usable credential.";
    return;
  }

  dom.authStatus.textContent = "Signing in with Google…";
  try {
    const session = await apiFetch("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential: response.credential })
    });
    await handleSessionChanged(session);
    closeModal(dom.authModal);
    showToast("Logged in with Google.", "success");
  } catch (error) {
    const feedback = getAuthErrorFeedback(error);
    dom.authStatus.textContent = feedback.inline;
    showToast(feedback.toast, "danger");
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!emailAuthEnabled()) return;
  const email = dom.authEmail.value.trim();
  const displayName = dom.authDisplayName.value.trim();
  if (!email) return;
  dom.authStatus.textContent = app.authMode === "signup"
    ? "Sending verification link…"
    : "Sending sign-in link…";

  try {
    const result = await apiFetch("/api/auth/email", {
      method: "POST",
      body: JSON.stringify({
        email,
        displayName,
        mode: app.authMode
      })
    });
    dom.authStatus.textContent = result?.message || "Check your inbox for the secure link.";
    showToast("Secure sign-in link sent.", "success");
  } catch (error) {
    const feedback = getAuthErrorFeedback(error);
    dom.authStatus.textContent = feedback.inline;
    showToast(feedback.toast, "danger");
  }
}

async function initAuthSession() {
  const session = await apiFetch("/api/auth/session", { method: "GET" });
  await handleSessionChanged(session);
}

function handleAuthRedirectParams() {
  const url = new URL(window.location.href);
  const auth = url.searchParams.get("auth");
  const authError = url.searchParams.get("authError");
  if (!auth && !authError) return;

  url.searchParams.delete("auth");
  url.searchParams.delete("authError");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);

  if (authError) {
    showToast(authError, "danger");
    return;
  }

  const message = auth === "signup"
    ? "Email confirmed. You are logged in."
    : "You are logged in.";
  showToast(message, "success");
}

async function handleSessionChanged(session) {
  app.session = session?.user ? session : null;
  setAuthIndicator();
  if (app.session?.user) {
    try {
      app.profile = await apiFetch("/api/me/profile", { method: "GET" });
      applySettings(app.profile.settings, true);
      renderProfile();
    } catch (error) {
      showToast(error.message, "danger");
    }
  } else {
    app.profile = null;
    const storedSettings = safeGet(STORAGE_KEYS.settings, null);
    if (storedSettings) {
      applySettings(JSON.parse(storedSettings), false);
    } else {
      applySettings(getDefaultSettings(), false);
    }
  }
  await Promise.all([loadLobbySongs(), loadMySongs()]);
  if (app.currentSongId) {
    await loadSong(app.currentSongId, { silent: true });
  }
  renderPracticeHelper();
  renderShortcutsModal();
  renderEditorHeader(app.currentSongId ? {
    id: app.currentSongId,
    title: dom.songTitle.value,
    artist: dom.songArtist.value,
    canEdit: app.currentSongCanEdit
  } : null);
  if (app.screen === "workspace" && !canAccessWorkspace()) {
    setScreen("lobby");
    return;
  }
  renderShell();
}

async function saveProfileSettings() {
  const settings = readSettingsFromInputs();
  applySettings(settings, true);
  if (!app.session?.user) {
    setShortcutStatus("Saved locally. Log in to sync these defaults to your profile.");
    renderPracticeHelper();
    renderShortcutsModal();
    scheduleAutosave();
    showToast("Practice defaults saved locally.", "success");
    return;
  }
  try {
    app.profile = await apiFetch("/api/me/profile", {
      method: "PUT",
      body: JSON.stringify({
        displayName: app.profile?.displayName || app.session.user.displayName || app.session.user.email || "",
        settings
      })
    });
    setShortcutStatus("Profile defaults saved.");
    renderProfile();
    renderPracticeHelper();
    renderShortcutsModal();
    showToast("Profile defaults saved.", "success");
  } catch (error) {
    setShortcutStatus(error.message);
    showToast(error.message, "danger");
  }
}

function resetSettings() {
  applySettings(getDefaultSettings(), true);
  setShortcutStatus("Defaults restored.");
  renderPracticeHelper();
  renderShortcutsModal();
  showToast("Keyboard and practice defaults restored.", "success");
}

function exportCurrentSong() {
  dom.exportOutput.value = JSON.stringify(collectSongPayload(), null, 2);
}

function readOffsets() {
  songStartSec = Math.max(0, ensureNumber(dom.songOffset.value, 0));
  pianoStartSec = Math.max(0, ensureNumber(dom.pianoOffset.value, 0));
}

function getMasterTime() {
  if (!songPlayer?.getCurrentTime) return 0;
  return Math.max(0, ensureNumber(songPlayer.getCurrentTime(), 0) - songStartSec);
}

function clampMasterTime(value) {
  const safe = Math.max(0, ensureNumber(value, 0));
  return duration > 0 ? Math.min(duration, safe) : safe;
}

function canSync() {
  return Boolean(songPlayer && pianoPlayer && readySong && readyPiano);
}

function setTransportTime(masterTime) {
  const safe = clampMasterTime(masterTime);
  dom.scrubber.value = String(safe);
  dom.timeLabel.textContent = `${fmtTime(safe)} / ${fmtTime(duration)}`;
}

function safeSeekBoth(masterTime, seekAhead = true) {
  if (!canSync()) return;
  const safe = clampMasterTime(masterTime);
  songPlayer.seekTo(songStartSec + safe, seekAhead);
  pianoPlayer.seekTo(pianoStartSec + safe, seekAhead);
  setTransportTime(safe);
  setActiveLyricByTime(safe);
}

function enableTransport(enabled) {
  dom.playBtn.disabled = !enabled;
  dom.restartBtn.disabled = !enabled;
  dom.mutePianoBtn.disabled = !enabled;
  dom.scrubber.disabled = !enabled;
  dom.toggleLoopBtn.disabled = !enabled;
  dom.setLoopABtn.disabled = !enabled;
  dom.setLoopBBtn.disabled = !enabled;
  dom.clearLoopBtn.disabled = !enabled;
  dom.resyncBtn.disabled = !enabled;
}

function updateMuteIcon() {
  if (!pianoPlayer?.isMuted) {
    dom.muteIconPath.setAttribute("d", MUTE_ICON_PATH);
    return;
  }
  dom.muteIconPath.setAttribute("d", pianoPlayer.isMuted() ? UNMUTE_ICON_PATH : MUTE_ICON_PATH);
}

function setSyncing(value) {
  isSyncing = value;
  dom.playIconPath.setAttribute("d", value ? PAUSE_ICON_PATH : PLAY_ICON_PATH);
  metronome.syncWithPlayback(value);
  if (value) startSyncLoop();
  else stopSyncLoop();
}

function stopSyncLoop() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

function maybeHandleLoop(master) {
  if (!app.loop.enabled || app.loop.aSec == null || app.loop.bSec == null) return;
  if (master < app.loop.bSec - 0.02) return;
  if (app.loop.repeatTarget > 0 && app.loop.completed >= app.loop.repeatTarget) {
    app.loop.enabled = false;
    renderLoopStatus();
    return;
  }
  app.loop.completed += 1;
  app.diagnostics.loopCycles += 1;
  renderDiagnostics();
  renderLoopStatus();
  safeSeekBoth(app.loop.aSec, true);
}

function startSyncLoop() {
  stopSyncLoop();
  syncTimer = setInterval(() => {
    if (!canSync() || !isSyncing || userScrubbing) return;
    const master = clampMasterTime(getMasterTime());
    const targetPiano = master + pianoStartSec;
    const currentPiano = ensureNumber(pianoPlayer.getCurrentTime?.(), targetPiano);
    const drift = currentPiano - targetPiano;
    app.diagnostics.driftMs = drift * 1000;
    if (Math.abs(drift) > 0.45 && Date.now() - lastPianoCorrectionAt > 500) {
      pianoPlayer.seekTo(Math.max(0, targetPiano), true);
      lastPianoCorrectionAt = Date.now();
      app.diagnostics.corrections += 1;
    }
    setTransportTime(master);
    setActiveLyricByTime(master);
    maybeHandleLoop(master);
    renderDiagnostics();
  }, 100);
}

function cancelCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  dom.countdownOverlay.classList.add("hidden");
}

function renderDiagnostics() {
  dom.diagDrift.textContent = `${Math.round(app.diagnostics.driftMs)} ms`;
  dom.diagCorrections.textContent = String(app.diagnostics.corrections);
  dom.diagBuffering.textContent = String(app.diagnostics.bufferingEvents);
  dom.diagLoops.textContent = String(app.diagnostics.loopCycles);
}

function renderLoopStatus() {
  const a = app.loop.aSec == null ? "--:--" : fmtTime(app.loop.aSec);
  const b = app.loop.bSec == null ? "--:--" : fmtTime(app.loop.bSec);
  const repeats = app.loop.repeatTarget === 0 ? "inf" : app.loop.repeatTarget;
  dom.loopStatus.textContent = `Loop ${app.loop.enabled ? "On" : "Off"} | A ${a} | B ${b} | ${app.loop.completed}/${repeats}`;
}

function startPlaybackNow() {
  if (!canSync()) return;
  if (app.settings.autoEnterPracticeOnPlay && app.screen !== "practice") {
    setScreen("practice", {
      requestFullscreen: true,
      returnScreen: canAccessWorkspace() ? "workspace" : "lobby"
    });
  }
  lastPlayRequestAt = Date.now();
  const master = userScrubbing ? ensureNumber(dom.scrubber.value, 0) : getMasterTime();
  safeSeekBoth(master);
  songPlayer.playVideo();
  pianoPlayer.playVideo();
  setSyncing(true);
}

function startPlaybackWithCountdown() {
  if (!canSync()) return;
  const count = Math.max(0, Math.floor(ensureNumber(dom.countdownSec.value, 0)));
  if (count <= 0) {
    startPlaybackNow();
    return;
  }
  cancelCountdown();
  let left = count;
  dom.countdownValue.textContent = String(left);
  dom.countdownOverlay.classList.remove("hidden");
  countdownTimer = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      cancelCountdown();
      startPlaybackNow();
      return;
    }
    dom.countdownValue.textContent = String(left);
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
  safeSeekBoth(0);
}

function toggleMutePiano() {
  if (!pianoPlayer?.isMuted) return;
  if (pianoPlayer.isMuted()) pianoPlayer.unMute();
  else pianoPlayer.mute();
  updateMuteIcon();
}

function setLoopPoint(which) {
  if (!canSync()) return;
  const master = clampMasterTime(getMasterTime());
  if (which === "a") app.loop.aSec = master;
  else app.loop.bSec = master;
  if (app.loop.aSec != null && app.loop.bSec != null && app.loop.bSec <= app.loop.aSec) {
    app.loop.bSec = app.loop.aSec + 0.2;
  }
  app.loop.completed = 0;
  renderLoopStatus();
  scheduleAutosave();
}

function clearLoop() {
  app.loop.enabled = false;
  app.loop.aSec = null;
  app.loop.bSec = null;
  app.loop.completed = 0;
  renderLoopStatus();
}

function toggleLoopEnabled() {
  if (app.loop.aSec == null || app.loop.bSec == null) {
    showToast("Set both loop points first.", "danger");
    return;
  }
  app.loop.repeatTarget = Math.max(0, Math.floor(ensureNumber(dom.loopRepeats.value, app.loop.repeatTarget)));
  app.loop.enabled = !app.loop.enabled;
  app.loop.completed = 0;
  renderLoopStatus();
}

function setMetronomeButtonLabel() {
  dom.toggleMetronomeBtn.textContent = metronome.enabled ? "Metronome On" : "Metronome Off";
}

function toggleMetronome() {
  metronome.setBpm(ensureNumber(dom.metronomeBpm.value, 92));
  metronome.setBeatsPerBar(ensureNumber(dom.metronomeBeatsPerBar.value, 4));
  metronome.setEnabled(!metronome.enabled);
  metronome.syncWithPlayback(isSyncing);
  setMetronomeButtonLabel();
}

function playSection(section, enableLoop) {
  if (!canSync()) return;
  app.loop.enabled = enableLoop && section.endSec != null;
  app.loop.aSec = section.startSec;
  app.loop.bSec = section.endSec;
  app.loop.completed = 0;
  app.loop.repeatTarget = section.repeatCount;
  renderLoopStatus();
  safeSeekBoth(section.startSec, true);
  startPlaybackWithCountdown();
}

function jumpToMarker(markerId) {
  const marker = app.markers.find((item) => item.id === markerId);
  if (!marker || !canSync()) return;
  cancelCountdown();
  songPlayer.pauseVideo();
  pianoPlayer.pauseVideo();
  setSyncing(false);
  safeSeekBoth(marker.masterTimeSec, true);
}

function addOrUpdateMarkerFromForm() {
  const marker = normalizeMarker({
    id: dom.markerName.dataset.editId || undefined,
    label: dom.markerName.value.trim(),
    masterTimeSec: dom.markerTime.value
  }, app.markers.length);
  if (!marker) return;
  const existingIdx = app.markers.findIndex((item) => item.id === marker.id);
  if (existingIdx >= 0) app.markers[existingIdx] = marker;
  else app.markers.push(marker);
  sortMarkers();
  dom.markerName.value = "";
  dom.markerName.dataset.editId = "";
  dom.markerTime.value = "0";
  renderMarkersList();
  scheduleAutosave();
}

function captureMarkerAtCurrentTime() {
  const current = canSync() ? getMasterTime() : ensureNumber(dom.scrubber.value, 0);
  const threshold = app.settings.markerRetargetThresholdSec;
  let closest = null;
  let distance = Infinity;
  for (const marker of app.markers) {
    const diff = Math.abs(marker.masterTimeSec - current);
    if (diff <= threshold && diff < distance) {
      closest = marker;
      distance = diff;
    }
  }

  if (closest) {
    closest.masterTimeSec = round2(current);
    sortMarkers();
    showToast(`Moved "${closest.label}" to ${fmtTime(current)}.`);
  } else {
    const next = normalizeMarker({
      id: genId("marker"),
      label: `Label ${app.markers.length + 1}`,
      masterTimeSec: current
    }, app.markers.length);
    app.markers.push(next);
    sortMarkers();
    showToast(`Captured ${next.label} at ${fmtTime(current)}.`);
  }

  renderMarkersList();
  scheduleAutosave();
}

function addOrUpdateSectionFromForm() {
  const section = normalizeSection({
    id: dom.sectionName.dataset.editId || undefined,
    name: dom.sectionName.value,
    color: dom.sectionColor.value,
    startSec: dom.sectionStart.value,
    endSec: dom.sectionEnd.value,
    repeatCount: dom.sectionRepeat.value,
    shortcut: dom.sectionShortcut.value
  }, app.sections.length);
  const existingIdx = app.sections.findIndex((item) => item.id === section.id);
  if (existingIdx >= 0) app.sections[existingIdx] = section;
  else app.sections.push(section);
  sortSections();
  dom.sectionName.value = "";
  dom.sectionName.dataset.editId = "";
  dom.sectionEnd.value = "";
  renderSectionsList();
  scheduleAutosave();
}

function setSectionStartFromCurrent() {
  dom.sectionStart.value = String(round2(canSync() ? getMasterTime() : ensureNumber(dom.scrubber.value, 0)));
}

function setSectionEndFromCurrent() {
  dom.sectionEnd.value = String(round2(canSync() ? getMasterTime() : ensureNumber(dom.scrubber.value, 0)));
}

function togglePracticeMode(force) {
  const next = typeof force === "boolean"
    ? force
    : app.screen !== "practice";
  if (next) {
    if (!hasPracticeCandidate()) {
      showToast("Pick a song or load both videos first.", "danger");
      return;
    }
    setScreen("practice", {
      requestFullscreen: true,
      returnScreen: canAccessWorkspace() ? "workspace" : "lobby"
    });
    return;
  }
  setScreen(app.returnScreen === "workspace" && canAccessWorkspace() ? "workspace" : "lobby");
}

function onFullscreenChange() {
  if (!document.fullscreenElement && app.screen === "practice") {
    setScreen(app.returnScreen === "workspace" && canAccessWorkspace() ? "workspace" : "lobby");
    return;
  }
  schedulePracticeLayout();
}

function calibrateUsingCurrentFrame() {
  if (!canSync()) {
    setCalibrateStatus("Load both videos first.");
    return;
  }
  const songCurrent = ensureNumber(songPlayer.getCurrentTime?.(), 0);
  const pianoCurrent = ensureNumber(pianoPlayer.getCurrentTime?.(), 0);
  const delta = pianoCurrent - songCurrent;
  const newPianoOffset = Math.max(0, songStartSec + delta);
  dom.pianoOffset.value = String(round2(newPianoOffset));
  readOffsets();
  safeSeekBoth(Math.max(0, songCurrent - songStartSec), true);
  setCalibrateStatus(`Tutorial offset adjusted by ${delta >= 0 ? "+" : ""}${round2(delta)}s.`);
}

function resetPlayerState(which) {
  if (app.playerUiState[which]) app.playerUiState[which].hasStartedPlayback = false;
}

function onPlayerStateChange(evt) {
  const playerKey = evt?.target === songPlayer ? "song" : evt?.target === pianoPlayer ? "piano" : "";
  const stateCode = evt?.data;
  if (playerKey) {
    if (stateCode === YT.PlayerState.PLAYING) {
      app.playerUiState[playerKey].hasStartedPlayback = true;
      setPlayerStatus(playerKey, "playing");
    } else if (stateCode === YT.PlayerState.BUFFERING) {
      setPlayerStatus(playerKey, "buffering");
      app.diagnostics.bufferingEvents += 1;
      renderDiagnostics();
    } else if (stateCode === YT.PlayerState.PAUSED) {
      setPlayerStatus(playerKey, app.playerUiState[playerKey].hasStartedPlayback ? "paused" : "ready");
    } else if (stateCode === YT.PlayerState.ENDED) {
      setPlayerStatus(playerKey, "ended");
    } else if (stateCode === YT.PlayerState.CUED) {
      setPlayerStatus(playerKey, "ready");
    }
  }

  if (!canSync()) return;
  const recentPlayRequest = Date.now() - lastPlayRequestAt < 2200;
  if (stateCode === YT.PlayerState.PLAYING && !isSyncing) {
    if (!recentPlayRequest) {
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
    if (!eitherPlaying && isSyncing) setSyncing(false);
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

async function loadPlayers(options = {}) {
  const readyToast = String(options.readyToast || "").trim();
  readOffsets();
  const songIssue = getYouTubeInputIssue("Official clip", dom.songUrl.value);
  const pianoIssue = getYouTubeInputIssue("Tutorial", dom.pianoUrl.value);
  if (songIssue || pianoIssue) {
    showToast([songIssue, pianoIssue].filter(Boolean).join(" "), "danger");
    return false;
  }
  await ensureYTApi();

  const songId = extractYouTubeId(dom.songUrl.value);
  const pianoId = extractYouTubeId(dom.pianoUrl.value);
  cancelCountdown();
  setSyncing(false);
  resetPlayerState("song");
  resetPlayerState("piano");
  readySong = false;
  readyPiano = false;
  duration = 0;
  app.diagnostics = { driftMs: 0, corrections: 0, bufferingEvents: 0, loopCycles: 0 };
  renderDiagnostics();
  enableTransport(false);
  setPlayerStatus("song", "loading");
  setPlayerStatus("piano", "loading");
  if (songPlayer?.destroy) songPlayer.destroy();
  if (pianoPlayer?.destroy) pianoPlayer.destroy();

  const onBothReady = () => {
    if (!readySong || !readyPiano) return;
    duration = Math.max(0, ensureNumber(songPlayer.getDuration?.(), 0) - songStartSec);
    dom.scrubber.max = String(duration || 100);
    setTimeout(() => {
      safeSeekBoth(0, true);
      songPlayer.pauseVideo();
      pianoPlayer.pauseVideo();
      enableTransport(true);
      updateMuteIcon();
      setTransportTime(0);
      setCalibrateStatus("Players loaded. Calibrate if the frames do not match musically.");
      setPlayerStatus("song", "ready");
      setPlayerStatus("piano", "ready");
      schedulePracticeLayout();
      if (readyToast) showToast(readyToast, "success");
    }, 200);
  };

  pianoPlayer = new YT.Player("pianoPlayer", {
    width: "100%",
    height: "100%",
    videoId: pianoId,
    playerVars: { playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, disablekb: 1 },
    events: {
      onReady: () => {
        readyPiano = true;
        pianoPlayer.mute();
        setPlayerStatus("piano", "ready");
        onBothReady();
      },
      onStateChange: onPlayerStateChange,
      onError: () => setPlayerStatus("piano", "error", "Load error")
    }
  });

  songPlayer = new YT.Player("songPlayer", {
    width: "100%",
    height: "100%",
    videoId: songId,
    playerVars: { playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, disablekb: 1 },
    events: {
      onReady: () => {
        readySong = true;
        setPlayerStatus("song", "ready");
        onBothReady();
      },
      onStateChange: onPlayerStateChange,
      onError: () => setPlayerStatus("song", "error", "Load error")
    }
  });
  return true;
}

function resyncNow() {
  if (!canSync()) return;
  safeSeekBoth(getMasterTime(), true);
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function handleCookieBanner() {
  if (window.syncConsent?.maybeShowBanner) {
    window.syncConsent.maybeShowBanner();
    return;
  }
  const saved = safeGet(STORAGE_KEYS.cookies, null);
  if (!saved) dom.cookieBanner.classList.remove("hidden");
}

function acceptCookies(optionalAllowed) {
  if (window.syncConsent?.saveConsentChoice) {
    window.syncConsent.saveConsentChoice(optionalAllowed);
    return;
  }
  safeSet(STORAGE_KEYS.cookies, JSON.stringify({
    essential: true,
    optional: Boolean(optionalAllowed),
    savedAt: Date.now()
  }));
  dom.cookieBanner.classList.add("hidden");
  if (optionalAllowed && typeof window.enableGoogleTagManager === "function") {
    window.enableGoogleTagManager();
  }
}

async function deleteAccount() {
  if (!app.profile?.deletionEnabled) return;
  const confirmation = dom.deleteAccountConfirmInput.value.trim();
  if (confirmation !== DELETE_ACCOUNT_CONFIRMATION) {
    dom.deleteAccountStatus.textContent = `Type ${DELETE_ACCOUNT_CONFIRMATION} exactly to continue.`;
    return;
  }
  if (!window.confirm("Delete your account permanently? This action cannot be undone.")) {
    dom.deleteAccountStatus.textContent = "Account deletion cancelled.";
    return;
  }
  dom.deleteAccountBtn.disabled = true;
  dom.deleteAccountStatus.textContent = "Deleting account…";
  try {
    const result = await apiFetch("/api/me/account/delete", {
      method: "POST",
      body: JSON.stringify({ confirmation })
    });
    await handleSessionChanged(null);
    resetDeleteAccountForm();
    closeModal(dom.profileModal);
    createNewDraft(true, { quiet: true, screen: "lobby" });
    const summary = [];
    if (Number(result?.deletedDraftSongs || 0) > 0) {
      summary.push(`${result.deletedDraftSongs} draft${result.deletedDraftSongs === 1 ? "" : "s"} deleted`);
    }
    if (Number(result?.anonymizedPublishedSongs || 0) > 0) {
      summary.push(`${result.anonymizedPublishedSongs} published song${result.anonymizedPublishedSongs === 1 ? "" : "s"} anonymized`);
    }
    showToast(summary.length ? `Account deleted. ${summary.join(", ")}.` : "Account deletion completed.", "success");
  } catch (error) {
    dom.deleteAccountStatus.textContent = error.message;
    renderProfile();
  }
}

async function initBootstrap() {
  app.bootstrap = await apiFetch("/api/bootstrap", { method: "GET" });
  setBootstrapStatus("Configuration loaded.");
  const localSettings = safeGet(STORAGE_KEYS.settings, null);
  applySettings(localSettings ? JSON.parse(localSettings) : getDefaultSettings(), false);
  initTheme();
  syncAuthModalState();
}

function bindEvents() {
  dom.themeBtn.addEventListener("click", () => {
    const current = document.body.dataset.themeMode || "system";
    const next = nextThemeMode(current);
    applyTheme(next, true);
    app.settings.themeMode = next;
    if (app.session?.user) saveProfileSettings();
  });

  dom.navLobbyBtn.addEventListener("click", () => setScreen("lobby"));
  dom.navWorkspaceBtn.addEventListener("click", () => setScreen("workspace"));
  dom.loginBtn.addEventListener("click", () => openAuthModal("login"));
  dom.signupBtn.addEventListener("click", () => openAuthModal("signup"));
  dom.heroCreateSongBtn.addEventListener("click", createNewDraft);
  dom.createSongBtn.addEventListener("click", createNewDraft);
  dom.newDraftBtn.addEventListener("click", createNewDraft);
  dom.practiceBackBtn.addEventListener("click", () => {
    setScreen(app.returnScreen === "workspace" && canAccessWorkspace() ? "workspace" : "lobby");
  });
  dom.practiceWorkspaceBtn.addEventListener("click", () => setScreen("workspace"));
  dom.profileBtn.addEventListener("click", openProfileModal);
  dom.logoutBtn.addEventListener("click", async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST", body: "{}" });
      await handleSessionChanged(null);
      showToast("Logged out.", "success");
    } catch (error) {
      showToast(error.message, "danger");
    }
  });

  dom.authTabLogin.addEventListener("click", () => openAuthModal("login"));
  dom.authTabSignup.addEventListener("click", () => openAuthModal("signup"));
  dom.authForm.addEventListener("submit", handleAuthSubmit);
  dom.closeAuthModalBtn.addEventListener("click", () => closeModal(dom.authModal));
  dom.closeProfileModalBtn.addEventListener("click", () => {
    resetDeleteAccountForm();
    closeModal(dom.profileModal);
  });
  dom.openShortcutsBtn.addEventListener("click", () => openModal(dom.shortcutsModal));
  dom.closeShortcutsBtn.addEventListener("click", () => closeModal(dom.shortcutsModal));
  dom.shortcutsModal.addEventListener("click", (event) => {
    if (event.target === dom.shortcutsModal) closeModal(dom.shortcutsModal);
  });
  dom.authModal.addEventListener("click", (event) => {
    if (event.target === dom.authModal) closeModal(dom.authModal);
  });
  dom.profileModal.addEventListener("click", (event) => {
    if (event.target === dom.profileModal) {
      resetDeleteAccountForm();
      closeModal(dom.profileModal);
    }
  });
  dom.deleteAccountConfirmInput.addEventListener("input", () => {
    dom.deleteAccountStatus.textContent = "";
    renderProfile();
  });

  dom.songSearch.addEventListener("input", () => {
    app.searchTerm = dom.songSearch.value;
    renderLobby();
  });

  dom.loadBtn.addEventListener("click", () => {
    loadPlayers({ readyToast: "Videos ready. Press play when you are ready." });
  });
  dom.saveSongBtn.addEventListener("click", saveCurrentSong);
  dom.calibrateBtn.addEventListener("click", calibrateUsingCurrentFrame);
  dom.usePastedBtn.addEventListener("click", usePastedLyrics);
  dom.exportPresetBtn.addEventListener("click", exportCurrentSong);
  dom.captureMarkerBtn.addEventListener("click", captureMarkerAtCurrentTime);
  dom.useCurrentMarkerBtn.addEventListener("click", () => {
    dom.markerTime.value = String(round2(canSync() ? getMasterTime() : ensureNumber(dom.scrubber.value, 0)));
  });
  dom.addMarkerBtn.addEventListener("click", addOrUpdateMarkerFromForm);
  dom.useCurrentSectionStartBtn.addEventListener("click", setSectionStartFromCurrent);
  dom.useCurrentSectionEndBtn.addEventListener("click", setSectionEndFromCurrent);
  dom.addSectionBtn.addEventListener("click", addOrUpdateSectionFromForm);
  dom.saveShortcutsBtn.addEventListener("click", saveProfileSettings);
  dom.resetShortcutsBtn.addEventListener("click", resetSettings);
  dom.playBtn.addEventListener("click", togglePlayPause);
  dom.restartBtn.addEventListener("click", restart);
  dom.mutePianoBtn.addEventListener("click", toggleMutePiano);
  dom.lyricsFocusBtn.addEventListener("click", () => {
    if (app.screen === "practice" && !app.practiceLyricsVisible) return;
    document.body.classList.toggle("lyrics-focus");
  });
  dom.toggleLoopBtn.addEventListener("click", toggleLoopEnabled);
  dom.setLoopABtn.addEventListener("click", () => setLoopPoint("a"));
  dom.setLoopBBtn.addEventListener("click", () => setLoopPoint("b"));
  dom.clearLoopBtn.addEventListener("click", clearLoop);
  dom.toggleMetronomeBtn.addEventListener("click", toggleMetronome);
  dom.resyncBtn.addEventListener("click", resyncNow);
  dom.practiceModeBtn.addEventListener("click", () => togglePracticeMode());
  dom.practiceStageBalance.addEventListener("input", () => {
    app.practiceLayout.manual = true;
    app.practiceLayout.balance = ensureNumber(dom.practiceStageBalance.value, app.practiceLayout.autoBalance);
    applyPracticeLayout();
  });
  dom.resetPracticeStageBtn.addEventListener("click", () => {
    app.practiceLayout.manual = false;
    schedulePracticeLayout(true);
  });
  dom.togglePracticeHelperBtn.addEventListener("click", () => {
    app.practiceHelperVisible = !app.practiceHelperVisible;
    dom.showPracticeShortcutLegend.value = String(app.practiceHelperVisible);
    renderPracticeHelperVisibility();
    scheduleAutosave();
  });
  dom.togglePracticeLyricsBtn.addEventListener("click", () => {
    app.practiceLyricsVisible = !app.practiceLyricsVisible;
    renderPracticeLyricsVisibility();
  });
  dom.lyricsPositionControls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lyrics-position]");
    if (!button) return;
    app.practiceLayout.lyricsPosition = normalizeLyricsPosition(button.dataset.lyricsPosition);
    renderLyricsPositionControls();
    schedulePracticeLayout();
  });
  dom.deleteAccountBtn.addEventListener("click", deleteAccount);
  if (!window.syncConsent) {
    dom.cookieEssentialBtn.addEventListener("click", () => acceptCookies(false));
    dom.cookieAcceptBtn.addEventListener("click", () => acceptCookies(true));
  }

  dom.scrubber.addEventListener("input", () => {
    userScrubbing = true;
    const time = ensureNumber(dom.scrubber.value, 0);
    setTransportTime(time);
    setActiveLyricByTime(time);
  });
  dom.scrubber.addEventListener("change", () => {
    if (canSync()) safeSeekBoth(ensureNumber(dom.scrubber.value, 0), true);
    userScrubbing = false;
  });

  document.addEventListener("input", (event) => {
    if (event.target?.id === "exportOutput") return;
    scheduleAutosave();
  });

  document.addEventListener("fullscreenchange", onFullscreenChange);
  window.addEventListener("resize", () => schedulePracticeLayout());
  window.addEventListener("keydown", handleKeydown);
}

function handleKeydown(event) {
  if (!app.settings) return;
  const activeTag = document.activeElement?.tagName;
  const typing = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT";

  if (event.key === "?" && !typing) {
    event.preventDefault();
    dom.shortcutsModal.classList.contains("hidden") ? openModal(dom.shortcutsModal) : closeModal(dom.shortcutsModal);
    return;
  }
  if (event.key === "Escape") {
    closeModal(dom.shortcutsModal);
    closeModal(dom.authModal);
    closeModal(dom.profileModal);
    if (app.screen === "practice") {
      setScreen(app.returnScreen === "workspace" && canAccessWorkspace() ? "workspace" : "lobby");
      return;
    }
  }
  if (typing) return;

  const shortcuts = app.settings.shortcuts;
  if (keyMatchesShortcut(event, shortcuts.playPause)) {
    event.preventDefault();
    togglePlayPause();
    return;
  }
  if (keyMatchesShortcut(event, shortcuts.restart)) {
    restart();
    return;
  }
  if (keyMatchesShortcut(event, shortcuts.mute)) {
    toggleMutePiano();
    return;
  }
  if (keyMatchesShortcut(event, shortcuts.lyricsFocus)) {
    if (app.screen === "practice" && !app.practiceLyricsVisible) return;
    document.body.classList.toggle("lyrics-focus");
    return;
  }
  if (keyMatchesShortcut(event, shortcuts.practiceMode)) {
    togglePracticeMode();
    return;
  }
  if (keyMatchesShortcut(event, shortcuts.metronomeToggle)) {
    toggleMetronome();
    return;
  }
  if (keyMatchesShortcut(event, shortcuts.toggleShortcutLegend)) {
    app.practiceHelperVisible = !app.practiceHelperVisible;
    dom.showPracticeShortcutLegend.value = String(app.practiceHelperVisible);
    renderPracticeHelperVisibility();
    scheduleAutosave();
    return;
  }
  if (keyMatchesShortcut(event, shortcuts.captureMarker)) {
    captureMarkerAtCurrentTime();
    return;
  }
  if (event.key === "ArrowLeft" && canSync()) {
    safeSeekBoth(getMasterTime() - 5, true);
    return;
  }
  if (event.key === "ArrowRight" && canSync()) {
    safeSeekBoth(getMasterTime() + 5, true);
    return;
  }

  const assignments = getMarkerJumpAssignments();
  for (const marker of app.markers) {
    const key = assignments.get(marker.id);
    if (key && event.key.toUpperCase() === key.toUpperCase()) {
      jumpToMarker(marker.id);
      return;
    }
  }

  const section = app.sections.find((item) => item.shortcut && item.shortcut.toUpperCase() === event.key.toUpperCase());
  if (section) playSection(section, false);
}

async function init() {
  applySettings(getStoredSettingsOrDefault(), false);
  populateSectionShortcutOptions();
  renderLoopStatus();
  renderDiagnostics();
  enableTransport(false);
  setPlayerStatus("song", "idle");
  setPlayerStatus("piano", "idle");
  bindEvents();
  handleCookieBanner();
  restoreDraft();
  try {
    await initBootstrap();
    await initAuthSession();
    handleAuthRedirectParams();
    await initGoogleIdentity();
  } catch (error) {
    setBootstrapStatus(error.message);
    showToast(error.message, "danger");
  }
  renderLyrics();
  renderMarkersList();
  renderSectionsList();
  renderShortcutsModal();
  setMetronomeButtonLabel();
  renderEditorHeader();
  renderShell();
  setupPracticeResizeObserver();
}

init();
