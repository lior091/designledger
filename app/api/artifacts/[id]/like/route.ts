import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { likeArtifact } from "@/lib/artifacts/repo";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const artifact = await likeArtifact(id);
  if (!artifact) return NextResponse.json({ error: "not_found" }, { status: 404 });
  revalidatePath("/");
  return NextResponse.json({ artifact });
}

