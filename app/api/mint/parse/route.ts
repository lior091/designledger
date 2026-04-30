import { NextResponse } from "next/server";

import { getAiProvider } from "@/lib/ai/provider";
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

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { text?: unknown }
    | null;
  const text = typeof body?.text === "string" ? body.text : "";

  if (!text.trim()) {
    return NextResponse.json({ candidates: [] });
  }

  const provider = getAiProvider();
  const candidates = await provider.parseSlackText(text);

  const enriched = await mapWithConcurrency(candidates, 4, async (c) => {
    if (c.coverUrl && c.title) return c;
    const preview = await fetchUrlPreview(c.url);
    return {
      ...c,
      title: c.title || preview.title || c.url,
      coverUrl: c.coverUrl ?? preview.imageUrl,
    };
  });

  return NextResponse.json({ candidates: enriched });
}

