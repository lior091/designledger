import { listPublishedArtifacts } from "@/lib/artifacts/repo";
import { getArtifactTopics } from "@/lib/artifacts/topics";
import { GalleryWithFilters } from "@/components/GalleryWithFilters";

export const dynamic = "force-dynamic";

export default async function Home() {
  const artifacts = await listPublishedArtifacts();
  const withTopics = artifacts.map((a) => ({ ...a, topics: getArtifactTopics(a) }));

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto w-full max-w-6xl px-6 pt-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-xs tracking-[0.25em] text-[color:var(--muted)]">
              DESIGN LEDGER
            </div>
            <h1 className="mt-3 text-2xl tracking-tight text-[color:var(--foreground)]">
              Artifact Gallery
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted)]">
              A neo-industrial archive of research artifacts, liked into
              permanence with deliberate review.
            </p>
          </div>
        </div>
        <div className="mt-8 h-px w-full bg-[color:var(--border)]" />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {artifacts.length === 0 ? (
          <div className="rounded-2xl mono-border p-8">
            <div className="text-sm text-[color:var(--foreground)]">
              No published artifacts yet.
            </div>
            <div className="mt-2 text-sm text-[color:var(--muted)]">
              Add artifacts via the admin minting flow (hidden in this mode).
            </div>
          </div>
        ) : (
          <GalleryWithFilters artifacts={withTopics} />
        )}
      </main>
    </div>
  );
}
