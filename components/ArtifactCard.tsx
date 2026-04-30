import type { Artifact } from "@/lib/artifacts/types";
import { getDecayOpacity } from "@/lib/artifacts/aging";
import { TechnicalRail } from "@/components/TechnicalRail";
import { ClientCover } from "@/components/ClientCover";

export function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const opacity = getDecayOpacity(artifact);

  return (
    <a
      href={artifact.url}
      target="_blank"
      rel="noreferrer"
      className="group relative aspect-square overflow-hidden rounded-xl mono-border neo-shadow transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
      style={{ opacity }}
    >
      <ClientCover url={artifact.url} initialCoverUrl={artifact.coverUrl} />
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.20) 50%, rgba(0,0,0,0.82) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[38%]"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,13,13,0.0) 0%, rgba(13,13,13,0.86) 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0">
        <TechnicalRail artifact={artifact} />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,176,32,.08), transparent)",
        }}
      />
    </a>
  );
}

