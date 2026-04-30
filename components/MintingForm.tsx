"use client";

import { useMemo, useState } from "react";

import type { ArtifactStatus } from "@/lib/artifacts/types";
import type { MintCandidate } from "@/lib/ai/provider";

type CandidateRow = MintCandidate & {
  selected: boolean;
  status: ArtifactStatus;
};

const STATUS_OPTIONS: Array<{ value: ArtifactStatus; label: string }> = [
  { value: "assess", label: "Assess" },
  { value: "trial", label: "Trial" },
  { value: "adopt", label: "Adopt" },
];

export function MintingForm() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"idle" | "parsing" | "committing">("idle");
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const selectedCount = useMemo(
    () => rows.filter((r) => r.selected).length,
    [rows],
  );

  async function parse() {
    setBusy("parsing");
    setMessage(null);
    try {
      const res = await fetch("/api/mint/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`Parse failed (${res.status})`);
      const data = (await res.json()) as { candidates?: MintCandidate[] };
      const candidates = Array.isArray(data.candidates) ? data.candidates : [];
      setRows(
        candidates.map((c) => ({
          ...c,
          selected: true,
          status: "assess",
        })),
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setBusy("idle");
    }
  }

  async function commit() {
    const items = rows
      .filter((r) => r.selected)
      .map((r) => ({
        url: r.url,
        title: r.title,
        researchSummary: r.researchSummary,
        tldr: null,
        coverUrl: r.coverUrl,
        status: r.status,
      }));

    if (items.length === 0) {
      setMessage("Select at least one candidate to commit.");
      return;
    }

    setBusy("committing");
    setMessage(null);
    try {
      const res = await fetch("/api/mint/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items, sourceText: text }),
      });
      if (!res.ok) throw new Error(`Commit failed (${res.status})`);
      const data = (await res.json()) as { ids?: string[]; skipped?: unknown[] };
      const saved = data.ids?.length ?? items.length;
      const skipped = Array.isArray(data.skipped) ? data.skipped.length : 0;
      setMessage(
        skipped > 0
          ? `Saved ${saved} draft(s). Skipped ${skipped} item(s).`
          : `Saved ${saved} draft artifact(s).`,
      );
      setRows([]);
      setText("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Commit failed");
    } finally {
      setBusy("idle");
    }
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[420px,1fr]">
      <div className="rounded-2xl mono-border p-5">
        <div className="text-xs tracking-[0.25em] text-[color:var(--muted)]">
          INPUT
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste raw Slack highlights here…"
          className="mt-3 h-[360px] w-full resize-none rounded-xl bg-transparent p-4 text-sm leading-6 mono-border focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={parse}
            disabled={busy !== "idle" || !text.trim()}
            className="rounded-full px-4 py-2 mono-border text-xs tracking-wide text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--steel-2)] disabled:opacity-50"
          >
            {busy === "parsing" ? "Parsing…" : "Parse URLs"}
          </button>
          <div className="text-xs text-[color:var(--muted)]">
            {rows.length > 0 ? `${rows.length} candidate(s)` : "—"}
          </div>
        </div>
        {message ? (
          <div className="mt-4 rounded-xl mono-border px-4 py-3 text-xs text-[color:var(--muted)]">
            {message}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl mono-border p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs tracking-[0.25em] text-[color:var(--muted)]">
              PREVIEW
            </div>
            <div className="mt-2 text-sm text-[color:var(--muted)]">
              Edit titles/insights before saving drafts.
            </div>
          </div>
          <button
            type="button"
            onClick={commit}
            disabled={busy !== "idle" || selectedCount === 0}
            className="rounded-full px-4 py-2 mono-border text-xs tracking-wide text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--steel-2)] disabled:opacity-50"
          >
            {busy === "committing"
              ? "Saving…"
              : `Save Drafts (${selectedCount})`}
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="mt-6 rounded-xl mono-border p-6 text-sm text-[color:var(--muted)]">
            Parse some Slack text to see candidates here.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {rows.map((row, idx) => (
              <div key={row.url} className="rounded-xl mono-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setRows((cur) =>
                          cur.map((r, i) =>
                            i === idx ? { ...r, selected: checked } : r,
                          ),
                        );
                      }}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs text-[color:var(--muted)]">
                        {row.url}
                      </div>
                      <input
                        value={row.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          setRows((cur) =>
                            cur.map((r, i) => (i === idx ? { ...r, title } : r)),
                          );
                        }}
                        className="mt-2 w-full rounded-lg bg-transparent px-3 py-2 text-sm mono-border focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
                      />
                    </div>
                  </label>

                  <select
                    value={row.status}
                    onChange={(e) => {
                      const status = e.target.value as ArtifactStatus;
                      setRows((cur) =>
                        cur.map((r, i) => (i === idx ? { ...r, status } : r)),
                      );
                    }}
                    className="rounded-lg bg-transparent px-3 py-2 text-xs mono-border focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} className="bg-black">
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  value={row.researchSummary}
                  onChange={(e) => {
                    const researchSummary = e.target.value;
                    setRows((cur) =>
                      cur.map((r, i) =>
                        i === idx ? { ...r, researchSummary } : r,
                      ),
                    );
                  }}
                  className="mt-3 w-full rounded-lg bg-transparent px-3 py-2 text-sm leading-6 mono-border focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
                  rows={2}
                />

                <div className="mt-3 text-xs text-[color:var(--muted)]">
                  Cover prompt: {row.coverPrompt}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

