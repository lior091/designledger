import { NextResponse } from "next/server";

import { listArtifacts, updateArtifact } from "@/lib/artifacts/repo";
import { fetchUrlPreview } from "@/lib/preview/fetchPreview";

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let i = 0;

  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx]!);
    }
  }

  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return results;
}

export async function POST() {
  const all = await listArtifacts();
  const missing = all.filter((a) => !a.coverUrl);

  const results = await mapWithConcurrency(missing, 4, async (a) => {
    const preview = await fetchUrlPreview(a.url);
    if (!preview.imageUrl && !preview.title) {
      return { id: a.id, updated: false };
    }

    await updateArtifact(a.id, {
      coverUrl: preview.imageUrl ?? a.coverUrl,
      title: a.title || preview.title || a.title,
    });

    return { id: a.id, updated: Boolean(preview.imageUrl || preview.title) };
  });

  const updated = results.filter((r) => r.updated).length;

  return NextResponse.json({
    scanned: all.length,
    missing: missing.length,
    updated,
  });
}

