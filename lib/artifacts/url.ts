const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "ref",
  "ref_src",
  "fbclid",
  "gclid",
]);

export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") return null;

  u.hash = "";
  u.username = "";
  u.password = "";

  u.hostname = u.hostname.toLowerCase();

  if ((u.protocol === "http:" && u.port === "80") || (u.protocol === "https:" && u.port === "443")) {
    u.port = "";
  }

  // Clean query params: drop common tracking params, then sort.
  const params = new URLSearchParams(u.search);
  for (const key of Array.from(params.keys())) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) params.delete(key);
  }
  const sorted = new URLSearchParams();
  Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([k, v]) => sorted.append(k, v));
  u.search = sorted.toString() ? `?${sorted.toString()}` : "";

  // Normalize pathname.
  u.pathname = u.pathname.replace(/\/+$/g, "");
  if (!u.pathname) u.pathname = "/";

  return u.toString();
}

