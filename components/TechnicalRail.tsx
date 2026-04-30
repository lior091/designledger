import type { Artifact } from "@/lib/artifacts/types";

import { isLegacy } from "@/lib/artifacts/aging";
import { ReadToggle } from "@/components/ReadToggle";
import { LikeButton } from "@/components/LikeButton";

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function TechnicalRail({ artifact }: { artifact: Artifact }) {
  const legacy = isLegacy(artifact);

  return (
    <div className="glass-rail px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm tracking-tight text-[color:var(--foreground)]">
            {artifact.title || artifact.url}
          </div>
          <div className="mt-1 line-clamp-2 text-[13px] leading-5 text-[color:var(--muted)]">
            {artifact.researchSummary}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
          {legacy ? (
            <div className="rounded-full px-2 py-1 mono-border text-[color:var(--muted)]">
              Legacy
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-[color:var(--muted)]">
        <div className="truncate">{safeHost(artifact.url)}</div>
        <div className="flex items-center gap-2">
          <LikeButton artifactId={artifact.id} count={artifact.endorsementCount} />
          <ReadToggle artifactId={artifact.id} isRead={Boolean(artifact.readAt)} />
        </div>
      </div>
    </div>
  );
}

