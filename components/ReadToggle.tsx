"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ReadToggle({
  artifactId,
  isRead,
}: {
  artifactId: string;
  isRead: boolean;
}) {
  if (process.env.NEXT_PUBLIC_READ_ONLY === "true") {
    return null;
  }

  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [optimisticRead, setOptimisticRead] = useState<boolean | null>(null);
  const shownRead = optimisticRead ?? isRead;

  return (
    <button
      type="button"
      className="rounded-full px-1.5 py-0.5 text-[11px] leading-4 mono-border text-[color:var(--foreground)]/75 hover:bg-[color:var(--steel-2)] disabled:opacity-50"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOptimisticRead(!shownRead);
        startTransition(async () => {
          try {
            await fetch(`/api/artifacts/${artifactId}/read`, { method: "POST" });
          } finally {
            router.refresh();
          }
        });
      }}
      aria-pressed={shownRead}
    >
      {pending ? "…" : shownRead ? "Read" : "New"}
    </button>
  );
}

