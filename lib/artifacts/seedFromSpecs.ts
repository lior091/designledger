import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Artifact } from "@/lib/artifacts/types";
import { normalizeUrl } from "@/lib/artifacts/url";
import { artifactIdFromUrl } from "@/lib/artifacts/repo";

type Bookmark = {
  title?: unknown;
  description?: unknown;
  link?: unknown;
  thumbnail?: unknown;
  shared_by?: unknown;
};

function toText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function loadSeedArtifactsFromSpecs(): Promise<Artifact[]> {
  const bookmarksPath = path.join(
    process.cwd(),
    "specs",
    "design_bookmarks_full.json",
  );

  const raw = await readFile(bookmarksPath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  const bookmarks: Bookmark[] = Array.isArray(parsed) ? (parsed as Bookmark[]) : [];

  const now = new Date().toISOString();
  const artifacts: Artifact[] = [];

  for (const b of bookmarks) {
    const linkRaw = toText(b?.link);
    const url = linkRaw ? normalizeUrl(linkRaw) : null;
    if (!url) continue;

    const title = toText(b?.title) || url;
    const description = toText(b?.description);
    const sharedBy = toText(b?.shared_by);
    const researchSummary =
      description || sharedBy
        ? `${description || ""}${sharedBy ? ` Shared by ${sharedBy}.` : ""}`.trim()
        : "";

    const thumbnail = toText(b?.thumbnail);
    const coverUrl = thumbnail || null;

    artifacts.push({
      id: artifactIdFromUrl(url),
      url,
      title,
      researchSummary: researchSummary || "Imported from specs.",
      tldr: null,
      coverUrl,
      status: "assess",
      endorsementCount: 0,
      readAt: null,
      createdAt: now,
      publishedAt: now,
      lastInteractedAt: now,
      maturityUpdatedAt: null,
      sourceTextHash: null,
    });
  }

  return artifacts;
}

