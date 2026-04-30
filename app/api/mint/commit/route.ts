import { NextResponse } from "next/server";

import type { ArtifactStatus } from "@/lib/artifacts/types";
import { upsertDraftArtifact } from "@/lib/artifacts/repo";
import { sha256Hex } from "@/lib/crypto/sha256";
import { normalizeUrl } from "@/lib/artifacts/url";

type CommitItem = {
  url: string;
  title: string;
  researchSummary: string;
  tldr?: string | null;
  coverUrl: string | null;
  status?: ArtifactStatus;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { items?: unknown; sourceText?: unknown }
    | null;

  const items = Array.isArray(body?.items) ? (body?.items as CommitItem[]) : [];
  const sourceText = typeof body?.sourceText === "string" ? body.sourceText : "";
  const sourceTextHash = sourceText ? sha256Hex(sourceText) : null;

  const ids: string[] = [];
  const skipped: Array<{ url: string; reason: string }> = [];
  for (const item of items) {
    if (!item || typeof item.url !== "string") continue;
    if (typeof item.title !== "string") continue;
    if (typeof item.researchSummary !== "string") continue;

    const normalized = normalizeUrl(item.url);
    if (!normalized) {
      skipped.push({ url: item.url, reason: "invalid_url" });
      continue;
    }

    if (!item.researchSummary.trim()) {
      skipped.push({ url: normalized, reason: "empty_summary" });
      continue;
    }

    try {
      const id = await upsertDraftArtifact({
        url: normalized,
        title: item.title.trim().slice(0, 120),
        researchSummary: item.researchSummary.trim().slice(0, 300),
        tldr:
          typeof item.tldr === "string" ? item.tldr.trim().slice(0, 400) : null,
        coverUrl: item.coverUrl ?? null,
        status: item.status,
        sourceTextHash,
      });
      ids.push(id);
    } catch (e) {
      skipped.push({
        url: normalized,
        reason: e instanceof Error ? e.message : "commit_failed",
      });
    }
  }

  return NextResponse.json({ ids, skipped });
}

