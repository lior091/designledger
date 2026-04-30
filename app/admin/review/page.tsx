import Link from "next/link";

import { listDraftArtifacts } from "@/lib/artifacts/repo";
import { TechnicalRail } from "@/components/TechnicalRail";
import { publish } from "./actions";
import { bootstrapImportBookmarksAndPublishAll } from "@/lib/artifacts/bootstrap";

export default async function ReviewPage() {
  const drafts = await listDraftArtifacts();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs tracking-[0.25em] text-[color:var(--muted)]">
            ADMIN
          </div>
          <h1 className="mt-3 text-2xl tracking-tight text-[color:var(--foreground)]">
            Review Queue
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
            Drafts are intentionally gated. Publish only what you want to enter
            the permanent ledger.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/mint"
            className="rounded-full px-4 py-2 mono-border text-xs tracking-wide text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--steel-2)]"
          >
            Mint
          </Link>
          <form
            action={async () => {
              "use server";
              // One-time bootstrap: import bookmarks and publish everything so the gallery is populated.
              await bootstrapImportBookmarksAndPublishAll();
            }}
          >
            <button
              type="submit"
              className="rounded-full px-4 py-2 mono-border text-xs tracking-wide text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--steel-2)]"
            >
              Bootstrap Publish
            </button>
          </form>
          <Link
            href="/"
            className="rounded-full px-4 py-2 mono-border text-xs tracking-wide text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--steel-2)]"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="mt-8 h-px w-full bg-[color:var(--border)]" />

      {drafts.length === 0 ? (
        <div className="mt-8 rounded-2xl mono-border p-8">
          <div className="text-sm text-[color:var(--foreground)]">
            No drafts waiting for review.
          </div>
          <div className="mt-2 text-sm text-[color:var(--muted)]">
            Create drafts from the{" "}
            <Link href="/admin/mint" className="text-[color:var(--amber)]">
              Minting Engine
            </Link>
            .
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {drafts.map((d) => (
            <div
              key={d.id}
              className="overflow-hidden rounded-2xl mono-border neo-shadow"
            >
              <div
                className="aspect-[16/9]"
                aria-hidden="true"
                style={{
                  backgroundImage: d.coverUrl
                    ? `url(${d.coverUrl})`
                    : "radial-gradient(900px 420px at 20% 0%, rgba(255,176,32,.22), transparent 55%), radial-gradient(700px 360px at 80% 20%, rgba(122,162,247,.12), transparent 60%), linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,.02))",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <TechnicalRail artifact={d} />
              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <Link
                  href={`/artifacts/${d.id}`}
                  className="rounded-full px-4 py-2 mono-border text-xs tracking-wide text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--steel-2)]"
                >
                  Inspect
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await publish(d.id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-full px-4 py-2 mono-border text-xs tracking-wide text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--steel-2)]"
                  >
                    Publish
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

