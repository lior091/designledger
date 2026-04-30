import { NextResponse } from "next/server";

import { listArtifacts, updateArtifact } from "@/lib/artifacts/repo";
import { generateTldr } from "@/lib/tldr/generateTldr";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { force?: unknown }
    | null;
  const force = body?.force === true;

  const all = await listArtifacts();
  const target = force
    ? all
    : all.filter((a) => !a.tldr || !a.tldr.trim() || a.tldr.includes("unavailable"));

  // IMPORTANT: JSON storage writes the entire file; concurrent updates can clobber each other.
  // Run sequentially to ensure all TL;DRs persist.
  const results: Array<{ id: string }> = [];
  for (const a of target) {
    const tldr = await generateTldr({
      url: a.url,
      title: a.title,
      researchSummary: a.researchSummary,
    });
    await updateArtifact(a.id, { tldr });
    results.push({ id: a.id });
  }

  return NextResponse.json({
    scanned: all.length,
    missing: target.length,
    updated: results.length,
    force,
  });
}

