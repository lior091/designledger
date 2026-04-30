"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export function LikeButton({
  artifactId,
  count,
}: {
  artifactId: string;
  count: number;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);
  const shownCount = useMemo(
    () => optimisticCount ?? count,
    [optimisticCount, count],
  );

  return (
    <button
      type="button"
      className="rounded-full px-1.5 py-0.5 text-[11px] leading-4 mono-border text-[color:var(--foreground)]/75 hover:bg-[color:var(--steel-2)] disabled:opacity-50 tabular-nums"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOptimisticCount((cur) => (cur ?? count) + 1);
        startTransition(async () => {
          try {
            await fetch(`/api/artifacts/${artifactId}/like`, { method: "POST" });
          } finally {
            router.refresh();
          }
        });
      }}
      title="Like"
    >
      {pending ? "…" : `♥ ${shownCount}`}
    </button>
  );
}

