import { normalizeUrl } from "@/lib/artifacts/url";

export type UrlPreview = {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
};

function pickFirst<T>(...values: Array<T | null | undefined>) {
  for (const v of values) {
    if (v !== null && v !== undefined && v !== "") return v;
  }
  return null;
}

function decodeHtmlEntities(input: string) {
  return input
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function extractMetaContent(html: string, attr: "property" | "name", key: string) {
  // Very small HTML parser by regex; good enough for meta tags.
  const re = new RegExp(
    `<meta[^>]*\\b${attr}\\s*=\\s*["']${key.replace(
      /[-/\\^$*+?.()|[\]{}]/g,
      "\\$&",
    )}["'][^>]*\\bcontent\\s*=\\s*["']([^"']+)["'][^>]*>`,
    "i",
  );
  const m = html.match(re);
  return m?.[1] ? decodeHtmlEntities(m[1]) : null;
}

function extractTitle(html: string) {
  const m = html.match(/<title[^>]*>([^<]{1,400})<\/title>/i);
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : null;
}

function toAbsoluteUrl(base: string, maybeRelative: string) {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return null;
  }
}

export async function fetchUrlPreview(rawUrl: string): Promise<UrlPreview> {
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) {
    return { url: rawUrl, title: null, description: null, imageUrl: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const res = await fetch(normalized, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "ArtifactGalleryBot/0.1 (+https://localhost) preview-fetch",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      return { url: normalized, title: null, description: null, imageUrl: null };
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("text/html")) {
      return { url: normalized, title: null, description: null, imageUrl: null };
    }

    const html = await res.text();

    const ogTitle = extractMetaContent(html, "property", "og:title");
    const twitterTitle = extractMetaContent(html, "name", "twitter:title");
    const docTitle = extractTitle(html);
    const title = pickFirst(ogTitle, twitterTitle, docTitle);

    const ogDesc = extractMetaContent(html, "property", "og:description");
    const twitterDesc = extractMetaContent(html, "name", "twitter:description");
    const metaDesc = extractMetaContent(html, "name", "description");
    const description = pickFirst(ogDesc, twitterDesc, metaDesc);

    const ogImg = extractMetaContent(html, "property", "og:image");
    const ogImgSecure = extractMetaContent(html, "property", "og:image:secure_url");
    const twitterImg = extractMetaContent(html, "name", "twitter:image");
    const imgRaw = pickFirst(ogImgSecure, ogImg, twitterImg);
    const imageUrl = imgRaw ? toAbsoluteUrl(normalized, imgRaw) : null;

    return { url: normalized, title, description, imageUrl };
  } catch {
    return { url: normalized, title: null, description: null, imageUrl: null };
  } finally {
    clearTimeout(timeout);
  }
}

