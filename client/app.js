/* global YT, supabase */

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
  practiceHelper: el("practiceHelper"),
  practiceModeBtn: el("practiceModeBtn"),
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
  authEmail: el("authEmail"),
  authPassword: el("authPassword"),
  authSubmitBtn: el("authSubmitBtn"),
  authStatus: el("authStatus"),
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
  supabase: null,
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
  practiceHelperVisible: true,
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
  const rawCode = String(error?.code || "").trim().toLowerCase();
  const normalized = rawMessage.toLowerCase();

  if (rawCode === "email_not_confirmed" || normalized.includes("email not confirmed")) {
    return {
      inline: "Please confirm your email before logging in. Check your inbox and spam for the confirmation link, then try again.",
      toast: "Email not confirmed yet. Check your inbox and spam, then log in again."
    };
  }

  return {
    inline: rawMessage || "Authentication failed.",
    toast: rawMessage || "Authentication failed."
  };
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
  const token = app.session?.access_token;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...options, headers });
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
}

function setScreen(nextScreen, options = {}) {
  let target = nextScreen;
  if (target === "workspace" && !canAccessWorkspace()) target = "lobby";
  if (target === "practice" && !hasPracticeCandidate()) {
    target = canAccessWorkspace() ? "workspace" : "lobby";
  }

  if (target === "practice") {
    app.returnScreen = options.returnScreen || (app.screen === "workspace" ? "workspace" : "lobby");
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
  dom.profileNameText.textContent = app.profile?.displayName || app.session?.user?.email || "Guest";
  dom.profileEmailText.textContent = app.profile?.email || "";
  const confirmationMatches = dom.deleteAccountConfirmInput.value.trim() === DELETE_ACCOUNT_CONFIRMATION;
  dom.deleteAccountBtn.disabled = !app.profile?.deletionEnabled || !confirmationMatches;
  if (!app.profile?.deletionEnabled) {
    dom.deleteAccountStatus.textContent = "Self-serve deletion is disabled until a Supabase service role key is configured on the server.";
    return;
  }
  if (!dom.deleteAccountStatus.textContent) {
    dom.deleteAccountStatus.textContent = `Deleting your account will remove your local profile data and request Supabase account deletion. Type ${DELETE_ACCOUNT_CONFIRMATION} exactly, then confirm the dialog. Published songs may remain visible.`;
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
    { key: app.settings.shortcuts.captureMarker, action: "Capture / retarget label" },
    { key: app.settings.shortcuts.toggleShortcutLegend, action: "Show / hide helper" },
    { key: app.settings.shortcuts.practiceMode, action: "Toggle fullscreen practice" },
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
  dom.practiceHelper.classList.toggle("hidden", !app.practiceHelperVisible);
  dom.togglePracticeHelperBtn.textContent = app.practiceHelperVisible ? "Hide helper" : "Show helper";
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

function renderLyrics() {
  dom.lyricsBox.innerHTML = "";
  if (!app.lyrics.length) {
    dom.lyricsBox.innerHTML = '<div class="small muted">No lyrics loaded yet.</div>';
    return;
  }
  for (const [idx, line] of app.lyrics.entries()) {
    const div = document.createElement("div");
    div.className = "line";
    div.dataset.idx = String(idx);
    div.textContent = (line.t != null ? `[${fmtTime(line.t)}] ` : "") + line.content;
    dom.lyricsBox.appendChild(div);
  }
  lastActiveLyricIndex = -1;
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
  setScreen("practice", { requestFullscreen: true, returnScreen: app.returnScreen });

  const song = await loadSong(songId, { silent: true });
  if (!song) {
    setScreen("lobby");
    return;
  }

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

function openAuthModal(mode) {
  app.authMode = mode;
  const login = mode !== "signup";
  dom.authTabLogin.classList.toggle("active", login);
  dom.authTabSignup.classList.toggle("active", !login);
  dom.authSubmitBtn.textContent = login ? "Log in" : "Create account";
  dom.authPassword.autocomplete = login ? "current-password" : "new-password";
  dom.authStatus.textContent = "";
  openModal(dom.authModal);
}

function openProfileModal() {
  resetDeleteAccountForm();
  renderProfile();
  renderMySongs();
  openModal(dom.profileModal);
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!app.supabase) return;
  const email = dom.authEmail.value.trim();
  const password = dom.authPassword.value;
  if (!email || !password) return;
  dom.authStatus.textContent = app.authMode === "signup" ? "Creating account…" : "Logging in…";

  try {
    if (app.authMode === "signup") {
      const result = await app.supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      const needsConfirmation = !result.data?.session;
      dom.authStatus.textContent = needsConfirmation
        ? "Check your inbox to confirm your email, then come back and log in."
        : "Account created. You are logged in.";
      showToast(
        needsConfirmation
          ? "Confirmation email sent. Finish verification, then log in."
          : "Account created.",
        "success"
      );
      if (!needsConfirmation) closeModal(dom.authModal);
      return;
    }

    const result = await app.supabase.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    closeModal(dom.authModal);
    showToast("Logged in.", "success");
  } catch (error) {
    const feedback = getAuthErrorFeedback(error);
    dom.authStatus.textContent = feedback.inline;
    showToast(feedback.toast, "danger");
  }
}

async function handleSessionChanged(session) {
  app.session = session || null;
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
        displayName: app.profile?.displayName || app.session.user.email || "",
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
  }
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
  const saved = safeGet(STORAGE_KEYS.cookies, null);
  if (!saved) {
    dom.cookieBanner.classList.remove("hidden");
  }
}

function acceptCookies(optionalAllowed) {
  safeSet(STORAGE_KEYS.cookies, JSON.stringify({
    essential: true,
    optional: Boolean(optionalAllowed),
    savedAt: Date.now()
  }));
  dom.cookieBanner.classList.add("hidden");
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
    await apiFetch("/api/me/account/delete", {
      method: "POST",
      body: JSON.stringify({ confirmation })
    });
    await handleSessionChanged(null);
    await app.supabase.auth.signOut();
    resetDeleteAccountForm();
    closeModal(dom.profileModal);
    createNewDraft(true, { quiet: true, screen: "lobby" });
    showToast("Account deletion completed.", "success");
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
}

async function initSupabase() {
  if (!window.supabase?.createClient) {
    throw new Error("Supabase browser client failed to load.");
  }
  app.supabase = window.supabase.createClient(
    app.bootstrap.supabase.url,
    app.bootstrap.supabase.publishableKey,
    { auth: { autoRefreshToken: true, persistSession: true } }
  );
  const { data } = await app.supabase.auth.getSession();
  app.session = data.session || null;
  app.supabase.auth.onAuthStateChange((_event, session) => {
    handleSessionChanged(session);
  });
  await handleSessionChanged(app.session);
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
    await app.supabase.auth.signOut();
    showToast("Logged out.", "success");
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
  dom.lyricsFocusBtn.addEventListener("click", () => document.body.classList.toggle("lyrics-focus"));
  dom.toggleLoopBtn.addEventListener("click", toggleLoopEnabled);
  dom.setLoopABtn.addEventListener("click", () => setLoopPoint("a"));
  dom.setLoopBBtn.addEventListener("click", () => setLoopPoint("b"));
  dom.clearLoopBtn.addEventListener("click", clearLoop);
  dom.toggleMetronomeBtn.addEventListener("click", toggleMetronome);
  dom.resyncBtn.addEventListener("click", resyncNow);
  dom.practiceModeBtn.addEventListener("click", () => togglePracticeMode());
  dom.togglePracticeHelperBtn.addEventListener("click", () => {
    app.practiceHelperVisible = !app.practiceHelperVisible;
    dom.showPracticeShortcutLegend.value = String(app.practiceHelperVisible);
    renderPracticeHelperVisibility();
    scheduleAutosave();
  });
  dom.deleteAccountBtn.addEventListener("click", deleteAccount);
  dom.cookieEssentialBtn.addEventListener("click", () => acceptCookies(false));
  dom.cookieAcceptBtn.addEventListener("click", () => acceptCookies(true));

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
    await initSupabase();
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
}

init();
