import { normalizeUrl } from "@/lib/artifacts/url";

function stripTags(html: string) {
  // Remove script/style/noscript and then all tags.
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const text = withoutScripts
    .replace(/<\/(p|div|br|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return text
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function fetchArticleText(rawUrl: string) {
  const url = normalizeUrl(rawUrl);
  if (!url) return { url: rawUrl, text: "" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "ArtifactGalleryBot/0.1 (+https://localhost) tldr-fetch",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) return { url, text: "" };
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("text/html")) return { url, text: "" };

    const html = await res.text();
    const text = stripTags(html);
    return { url, text };
  } catch {
    return { url, text: "" };
  } finally {
    clearTimeout(timeout);
  }
}

