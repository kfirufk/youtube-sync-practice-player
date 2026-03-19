(() => {
  const STORAGE_KEY = "sync-player-cookie-consent";
  const GTM_CONTAINER_ID = "GTM-TKNX6FXQ";
  const GTM_SCRIPT_ID = "syncGtmScript";
  const GTM_IFRAME_ID = "syncGtmIframe";

  function readConsent() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function writeConsent(optionalAllowed) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        essential: true,
        optional: Boolean(optionalAllowed),
        savedAt: Date.now()
      }));
    } catch (_error) {}
  }

  function hideBanner() {
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.classList.add("hidden");
  }

  function showBanner() {
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.classList.remove("hidden");
  }

  function getConsentFrame() {
    return document.getElementById("gtmConsentedFrame");
  }

  function injectConsentIframe() {
    const frameHost = getConsentFrame();
    if (!frameHost || document.getElementById(GTM_IFRAME_ID)) return;
    const iframe = document.createElement("iframe");
    iframe.id = GTM_IFRAME_ID;
    iframe.src = "https://www.googletagmanager.com/ns.html?id=" + GTM_CONTAINER_ID;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    iframe.title = "Google Tag Manager";
    frameHost.appendChild(iframe);
  }

  function enableGoogleTagManager() {
    if (window.SYNC_GTM_LOADED) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const firstScript = document.getElementsByTagName("script")[0];
    const tag = document.createElement("script");
    tag.id = GTM_SCRIPT_ID;
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_CONTAINER_ID;
    firstScript.parentNode.insertBefore(tag, firstScript);
    window.SYNC_GTM_LOADED = true;
    injectConsentIframe();
  }

  function deleteCookieEverywhere(name) {
    const host = window.location.hostname;
    const parts = host.split(".").filter(Boolean);
    const domains = new Set(["", host, "." + host]);
    if (parts.length >= 2) {
      const baseDomain = parts.slice(-2).join(".");
      domains.add(baseDomain);
      domains.add("." + baseDomain);
    }
    for (const domain of domains) {
      const domainPart = domain ? "; domain=" + domain : "";
      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + domainPart;
    }
  }

  function clearAnalyticsCookies() {
    const names = document.cookie
      .split(";")
      .map((chunk) => chunk.trim().split("=")[0])
      .filter((name) => name && (name === "_ga" || name === "_gid" || name === "_gat" || name.startsWith("_ga_")));
    for (const name of names) deleteCookieEverywhere(name);
  }

  function disableGoogleTagManager() {
    clearAnalyticsCookies();
    const iframe = document.getElementById(GTM_IFRAME_ID);
    if (iframe) iframe.remove();
    const script = document.getElementById(GTM_SCRIPT_ID);
    if (script) script.remove();
    window.SYNC_GTM_LOADED = false;
  }

  function saveConsentChoice(optionalAllowed) {
    const previous = readConsent();
    writeConsent(optionalAllowed);
    hideBanner();
    if (optionalAllowed) {
      enableGoogleTagManager();
      return;
    }
    disableGoogleTagManager();
    if (previous?.optional) {
      window.location.reload();
    }
  }

  function maybeShowBanner() {
    if (!readConsent()) showBanner();
  }

  function bindConsentUi() {
    const essentialButton = document.getElementById("cookieEssentialBtn");
    const optionalButton = document.getElementById("cookieAcceptBtn");

    if (essentialButton) {
      essentialButton.addEventListener("click", () => saveConsentChoice(false));
    }
    if (optionalButton) {
      optionalButton.addEventListener("click", () => saveConsentChoice(true));
    }

    for (const trigger of document.querySelectorAll("[data-open-cookie-settings]")) {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        showBanner();
      });
    }

    maybeShowBanner();
  }

  window.SYNC_GTM_CONTAINER_ID = GTM_CONTAINER_ID;
  window.SYNC_GTM_LOADED = false;
  window.enableGoogleTagManager = enableGoogleTagManager;
  window.syncConsent = {
    getConsent: readConsent,
    maybeShowBanner,
    openSettings: showBanner,
    saveConsentChoice
  };

  if (readConsent()?.optional) {
    enableGoogleTagManager();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindConsentUi, { once: true });
  } else {
    bindConsentUi();
  }
})();
