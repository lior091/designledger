import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { toggleArtifactRead } from "@/lib/artifacts/repo";
import { isReadOnlyMode } from "@/lib/artifacts/readOnly";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (isReadOnlyMode()) {
    return NextResponse.json({ error: "read_only" }, { status: 403 });
  }
  const { id } = await params;
  const artifact = await toggleArtifactRead(id);
  if (!artifact) return NextResponse.json({ error: "not_found" }, { status: 404 });
  revalidatePath("/");
  return NextResponse.json({ artifact });
}

