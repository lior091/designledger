"use client";

import { useMemo, useState } from "react";

import type { Artifact } from "@/lib/artifacts/types";
import { ArtifactCard } from "@/components/ArtifactCard";

type ArtifactWithTopics = Artifact & { topics: string[] };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function GalleryWithFilters({
  artifacts,
}: {
  artifacts: ArtifactWithTopics[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of artifacts) {
      for (const t of a.topics) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
  }, [artifacts]);

  const filtered = useMemo(() => {
    if (!selected) return artifacts;
    return artifacts.filter((a) => a.topics.includes(selected));
  }, [artifacts, selected]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={cx(
            "rounded-full px-3 py-1 text-xs mono-border transition-colors",
            !selected
              ? "bg-[color:var(--steel-2)] text-[color:var(--foreground)]"
              : "text-[color:var(--muted)] hover:bg-[color:var(--steel-2)]",
          )}
          onClick={() => setSelected(null)}
        >
          All
          <span className="ml-2 tabular-nums text-[color:var(--muted)]">
            {artifacts.length}
          </span>
        </button>

        {topicCounts.map(({ topic, count }) => (
          <button
            key={topic}
            type="button"
            className={cx(
              "rounded-full px-3 py-1 text-xs mono-border transition-colors",
              selected === topic
                ? "bg-[color:var(--steel-2)] text-[color:var(--foreground)]"
                : "text-[color:var(--muted)] hover:bg-[color:var(--steel-2)]",
            )}
            onClick={() => setSelected((cur) => (cur === topic ? null : topic))}
          >
            {topic}
            <span className="ml-2 tabular-nums text-[color:var(--muted)]">
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="rounded-2xl mono-border p-8 text-sm text-[color:var(--muted)]">
            No artifacts match this topic.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <ArtifactCard key={a.id} artifact={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

