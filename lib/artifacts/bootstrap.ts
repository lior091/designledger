import { readFile } from "node:fs/promises";
import path from "node:path";

import { normalizeUrl } from "@/lib/artifacts/url";
import {
  listDraftArtifacts,
  publishArtifact,
  upsertDraftArtifact,
} from "@/lib/artifacts/repo";

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

export async function bootstrapImportBookmarksAndPublishAll() {
  const bookmarksPath = path.join(
    process.cwd(),
    "specs",
    "design_bookmarks_full.json",
  );

  const raw = await readFile(bookmarksPath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  const bookmarks: Bookmark[] = Array.isArray(parsed) ? (parsed as Bookmark[]) : [];

  let imported = 0;
  let published = 0;
  let skipped = 0;

  for (const b of bookmarks) {
    const linkRaw = toText(b?.link);
    const url = linkRaw ? normalizeUrl(linkRaw) : null;
    if (!url) {
      skipped++;
      continue;
    }

    const title = toText(b?.title) || url;
    const description = toText(b?.description);
    const sharedBy = toText(b?.shared_by);
    const researchSummary =
      description || sharedBy
        ? `${description || "Imported bookmark."}${sharedBy ? ` Shared by ${sharedBy}.` : ""}`.trim()
        : "Imported bookmark.";

    const thumbnail = toText(b?.thumbnail);
    const coverUrl = thumbnail || null;

    const id = await upsertDraftArtifact({
      url,
      title,
      researchSummary,
      tldr: null,
      coverUrl,
      status: "assess",
      sourceTextHash: null,
    });

    imported++;
    const result = await publishArtifact(id);
    if (result) published++;
  }

  // Publish any remaining drafts in the current ledger (from previous minting runs).
  const drafts = await listDraftArtifacts();
  for (const d of drafts) {
    const result = await publishArtifact(d.id);
    if (result) published++;
  }

  return {
    imported,
    published,
    skipped,
    totalBookmarks: bookmarks.length,
    remainingDrafts: (await listDraftArtifacts()).length,
  };
}

