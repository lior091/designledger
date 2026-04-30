import type { Artifact } from "@/lib/artifacts/types";

function safeHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function safePath(url: string) {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return "";
  }
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((n) => haystack.includes(n));
}

export function getArtifactTopics(artifact: Artifact): string[] {
  const host = safeHost(artifact.url);
  const path = safePath(artifact.url);
  const text = `${artifact.title} ${artifact.researchSummary} ${host}`.toLowerCase();
  const topics = new Set<string>();

  // Source-based
  if (host.includes("youtube.com") || host.includes("youtu.be")) topics.add("Video");
  if (host.includes("github.com")) topics.add("Dev");
  if (host.includes("medium.com") || host.includes("substack.com")) topics.add("Essay");
  if (includesAny(host, ["uxdesign.cc", "nngroup.com", "smashingmagazine.com"]))
    topics.add("UX");

  // Format / content-type hints
  if (path.endsWith(".pdf")) topics.add("PDF");
  if (includesAny(path, ["/docs", "/documentation", "/learn"])) topics.add("Docs");
  if (includesAny(host, ["oreilly.com"])) topics.add("Docs");
  if (includesAny(host, ["amazon.", "a.co"])) topics.add("Books");
  if (includesAny(host, ["eventbrite.", "meetup."])) topics.add("Events");

  // “Type” hubs (helps split Misc)
  if (includesAny(host, ["theverge.com", "techcrunch.com", "wired.com", "nytimes.com", "finance.yahoo.com"]))
    topics.add("News");
  if (includesAny(host, ["twitter.com", "x.com", "linkedin.com"])) topics.add("Social");
  if (includesAny(host, ["producthunt.com"])) topics.add("Product");

  // Keyword-based
  if (includesAny(text, ["ux", "user experience", "onboarding", "usability", "research"]))
    topics.add("UX");
  if (includesAny(text, ["security", "appsec", "breach", "malware", "phishing", "threat"]))
    topics.add("Security");
  if (includesAny(text, ["ai", "llm", "chatgpt", "dall-e", "agent", "automation"]))
    topics.add("AI");
  if (includesAny(text, ["writing", "copy", "microcopy", "content", "ux writing"]))
    topics.add("Writing");
  if (includesAny(text, ["career", "job", "role", "hiring", "management"]))
    topics.add("Career");
  if (includesAny(text, ["tools", "plugin", "extension", "library", "framework"]))
    topics.add("Tools");

  // Always have at least one bucket to filter by.
  if (topics.size === 0) topics.add("Other");

  return Array.from(topics).sort((a, b) => a.localeCompare(b));
}

