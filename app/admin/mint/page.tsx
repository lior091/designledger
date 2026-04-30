import Link from "next/link";

import { MintingForm } from "@/components/MintingForm";

export const dynamic = "force-dynamic";

export default function MintPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs tracking-[0.25em] text-[color:var(--muted)]">
            ADMIN
          </div>
          <h1 className="mt-3 text-2xl tracking-tight text-[color:var(--foreground)]">
            Minting Engine
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
            Paste Slack text, extract links, and stage artifacts as drafts for
            deliberate review.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/review"
            className="rounded-full px-4 py-2 mono-border text-xs tracking-wide text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--steel-2)]"
          >
            Review Drafts
          </Link>
          <Link
            href="/"
            className="rounded-full px-4 py-2 mono-border text-xs tracking-wide text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--steel-2)]"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="mt-8 h-px w-full bg-[color:var(--border)]" />

      <MintingForm />
    </div>
  );
}

