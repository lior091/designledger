import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Artifact, ArtifactStatus, ArtifactsFile } from "./types";
import { sha256Hex } from "@/lib/crypto/sha256";
import { normalizeUrl } from "@/lib/artifacts/url";

const ARTIFACTS_FILE_PATH = path.join(process.cwd(), "data", "artifacts.json");

function nowIso() {
  return new Date().toISOString();
}

function parseArtifactsFile(jsonText: string): ArtifactsFile {
  const parsed = JSON.parse(jsonText) as unknown;
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("version" in parsed) ||
    !("artifacts" in parsed)
  ) {
    throw new Error("Invalid artifacts.json format");
  }

  const file = parsed as ArtifactsFile;
  if (file.version !== 1 || !Array.isArray(file.artifacts)) {
    throw new Error("Unsupported artifacts.json version");
  }

  // Backfill defaults for older records (keeps schema changes non-destructive).
  file.artifacts = file.artifacts.map((a: any) => ({
    ...a,
    tldr: typeof a?.tldr === "string" ? a.tldr : null,
    readAt: typeof a?.readAt === "string" ? a.readAt : null,
  }));

  return file;
}

async function readArtifactsFile(): Promise<ArtifactsFile> {
  try {
    const text = await readFile(ARTIFACTS_FILE_PATH, "utf-8");
    return parseArtifactsFile(text);
  } catch (e: any) {
    // In some deploy environments (e.g. Vercel) the JSON file may not exist.
    // Treat it as an empty ledger instead of crashing prerender/build.
    if (e?.code === "ENOENT") {
      return { version: 1, artifacts: [] };
    }
    throw e;
  }
}

async function writeArtifactsFile(next: ArtifactsFile) {
  const tmpPath = `${ARTIFACTS_FILE_PATH}.${Date.now()}.tmp`;
  await writeFile(tmpPath, JSON.stringify(next, null, 2) + "\n", "utf-8");
  await rename(tmpPath, ARTIFACTS_FILE_PATH);
}

export type CreateArtifactInput = {
  url: string;
  title: string;
  researchSummary: string;
  tldr?: string | null;
  coverUrl: string | null;
  status?: ArtifactStatus;
  sourceTextHash?: string | null;
};

export function artifactIdFromUrl(url: string) {
  const normalized = normalizeUrl(url);
  if (!normalized) throw new Error("Invalid URL");
  return sha256Hex(normalized).slice(0, 24);
}

export async function listArtifacts() {
  const file = await readArtifactsFile();
  return file.artifacts;
}

export async function listPublishedArtifacts() {
  const all = await listArtifacts();
  return all
    .filter((a) => a.publishedAt)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

export async function listDraftArtifacts() {
  const all = await listArtifacts();
  return all
    .filter((a) => !a.publishedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getArtifactById(id: string) {
  const all = await listArtifacts();
  return all.find((a) => a.id === id) ?? null;
}

export async function upsertDraftArtifact(input: CreateArtifactInput) {
  const file = await readArtifactsFile();
  const normalizedUrl = normalizeUrl(input.url);
  if (!normalizedUrl) throw new Error("Invalid URL");

  // If we already have this URL (possibly with different tracking params), reuse the existing id.
  const existingIdx = file.artifacts.findIndex(
    (a) => normalizeUrl(a.url) === normalizedUrl,
  );
  const id = existingIdx === -1 ? artifactIdFromUrl(normalizedUrl) : file.artifacts[existingIdx]!.id;

  const base: Artifact = {
    id,
    url: normalizedUrl,
    title: input.title,
    researchSummary: input.researchSummary,
    tldr: input.tldr ?? null,
    coverUrl: input.coverUrl ?? null,
    status: input.status ?? "assess",
    endorsementCount: 0,
    readAt: null,
    createdAt: nowIso(),
    publishedAt: null,
    lastInteractedAt: nowIso(),
    maturityUpdatedAt: null,
    sourceTextHash: input.sourceTextHash ?? null,
  };

  if (existingIdx === -1) {
    file.artifacts.unshift(base);
  } else {
    const existing = file.artifacts[existingIdx]!;
    file.artifacts[existingIdx] = {
      ...existing,
      ...base,
      // Preserve moderation signals
      endorsementCount: existing.endorsementCount,
      publishedAt: existing.publishedAt,
      createdAt: existing.createdAt,
    };
  }

  await writeArtifactsFile(file);
  return id;
}

export async function publishArtifact(id: string) {
  const file = await readArtifactsFile();
  const idx = file.artifacts.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const current = file.artifacts[idx]!;
  const next: Artifact = {
    ...current,
    publishedAt: current.publishedAt ?? nowIso(),
    lastInteractedAt: nowIso(),
  };
  file.artifacts[idx] = next;
  await writeArtifactsFile(file);
  return next;
}

export async function endorseArtifact(id: string) {
  const file = await readArtifactsFile();
  const idx = file.artifacts.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const current = file.artifacts[idx]!;
  const next: Artifact = {
    ...current,
    endorsementCount: current.endorsementCount + 1,
    lastInteractedAt: nowIso(),
  };
  file.artifacts[idx] = next;
  await writeArtifactsFile(file);
  return next;
}

export async function likeArtifact(id: string) {
  // Alias for endorsementCount as "likes" in the UI.
  return endorseArtifact(id);
}

export async function setArtifactStatus(id: string, status: ArtifactStatus) {
  const file = await readArtifactsFile();
  const idx = file.artifacts.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const current = file.artifacts[idx]!;
  const next: Artifact = {
    ...current,
    status,
    maturityUpdatedAt: nowIso(),
    lastInteractedAt: nowIso(),
  };
  file.artifacts[idx] = next;
  await writeArtifactsFile(file);
  return next;
}

export type UpdateArtifactInput = {
  title?: string;
  researchSummary?: string;
  tldr?: string | null;
  coverUrl?: string | null;
  readAt?: string | null;
  lastInteractedAt?: string;
};

export async function updateArtifact(id: string, patch: UpdateArtifactInput) {
  const file = await readArtifactsFile();
  const idx = file.artifacts.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const current = file.artifacts[idx]!;
  const next: Artifact = {
    ...current,
    ...(patch.title !== undefined ? { title: patch.title } : null),
    ...(patch.researchSummary !== undefined
      ? { researchSummary: patch.researchSummary }
      : null),
    ...(patch.tldr !== undefined ? { tldr: patch.tldr } : null),
    ...(patch.coverUrl !== undefined ? { coverUrl: patch.coverUrl } : null),
    ...(patch.readAt !== undefined ? { readAt: patch.readAt } : null),
    ...(patch.lastInteractedAt !== undefined
      ? { lastInteractedAt: patch.lastInteractedAt }
      : null),
  };
  file.artifacts[idx] = next;
  await writeArtifactsFile(file);
  return next;
}

export async function toggleArtifactRead(id: string) {
  const file = await readArtifactsFile();
  const idx = file.artifacts.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const current = file.artifacts[idx]!;
  const next: Artifact = {
    ...current,
    readAt: current.readAt ? null : nowIso(),
    lastInteractedAt: nowIso(),
  };
  file.artifacts[idx] = next;
  await writeArtifactsFile(file);
  return next;
}

