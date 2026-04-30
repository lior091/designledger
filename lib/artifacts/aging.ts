import type { Artifact } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseIso(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function getLegacyAnchorDate(artifact: Artifact) {
  const published = artifact.publishedAt ? parseIso(artifact.publishedAt) : null;
  const created = parseIso(artifact.createdAt);
  return published ?? created ?? new Date();
}

export function isLegacy(artifact: Artifact, now = new Date()) {
  const anchor = getLegacyAnchorDate(artifact);
  const ageDays = (now.getTime() - anchor.getTime()) / DAY_MS;
  return ageDays >= 183; // ~6 months
}

export function getDecayOpacity(artifact: Artifact, now = new Date()) {
  const interacted = parseIso(artifact.lastInteractedAt) ?? now;
  const staleDays = (now.getTime() - interacted.getTime()) / DAY_MS;

  const startFadeDays = 92; // ~3 months
  const fullFadeDays = 210; // keep some presence after ~7 months
  const minOpacity = 0.45;

  if (staleDays <= startFadeDays) return 1;
  if (staleDays >= fullFadeDays) return minOpacity;

  const t = (staleDays - startFadeDays) / (fullFadeDays - startFadeDays);
  return 1 - t * (1 - minOpacity);
}

