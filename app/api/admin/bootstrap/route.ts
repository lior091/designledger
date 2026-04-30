import { NextResponse } from "next/server";

import { bootstrapImportBookmarksAndPublishAll } from "@/lib/artifacts/bootstrap";

export async function POST() {
  const result = await bootstrapImportBookmarksAndPublishAll();
  return NextResponse.json(result);
}

