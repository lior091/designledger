import { NextResponse } from "next/server";

import { fetchUrlPreview } from "@/lib/preview/fetchPreview";
import { normalizeUrl } from "@/lib/artifacts/url";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url") || "";
  const url = normalizeUrl(rawUrl);
  if (!url) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const preview = await fetchUrlPreview(url);
  return NextResponse.json({
    url: preview.url,
    title: preview.title,
    description: preview.description,
    imageUrl: preview.imageUrl,
  });
}

