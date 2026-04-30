import { NextResponse } from "next/server";

import { bootstrapImportBookmarksAndPublishAll } from "@/lib/artifacts/bootstrap";
import { isReadOnlyMode } from "@/lib/artifacts/readOnly";

export async function POST() {
  if (isReadOnlyMode()) {
    return NextResponse.json({ error: "read_only" }, { status: 403 });
  }
  const result = await bootstrapImportBookmarksAndPublishAll();
  return NextResponse.json(result);
}

