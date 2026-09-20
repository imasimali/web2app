export const SITE_URL = "https://www.asimali.net/";

// Hosts allowed to render inside the app. Everything else opens externally.
// www.asimali.net redirects to the apex, so both have to be here.
export const ALLOWED_HOSTS = ["asimali.net", "www.asimali.net"];

// Schemes the OS owns rather than the WebView.
export const EXTERNAL_SCHEMES = ["mailto:", "tel:", "sms:", "intent:"];

// The site's own default background, so the splash hands over without a flash.
export const FALLBACK_BACKGROUND = "#222A36";

// A cold start on a slow connection needs room before we call it a failure.
export const LOAD_TIMEOUT_MS = 20000;

const RGB = /rgba?\(([^)]+)\)/;

/**
 * Whether this background needs light-on-dark chrome. Input is whatever
 * getComputedStyle returned, so it may be an rgb()/rgba() string, a hex
 * fallback, or nonsense. Anything unparseable or fully transparent falls
 * back to true, which matches the site's default.
 */
export function isDarkColor(color) {
  const match = RGB.exec(color || "");
  if (!match) return true;

  const [r, g, b, a] = match[1].split(",").map((part) => parseFloat(part));
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return true;
  if (a === 0) return true;

  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}
