"use server";

import { revalidatePath } from "next/cache";

import { publishArtifact } from "@/lib/artifacts/repo";

export async function publish(id: string) {
  await publishArtifact(id);
  revalidatePath("/");
  revalidatePath("/admin/review");
  revalidatePath(`/artifacts/${id}`);
}

