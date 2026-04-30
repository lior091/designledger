"use client";

import { useEffect, useMemo, useState } from "react";

function fallbackGradient() {
  return "radial-gradient(900px 420px at 20% 0%, rgba(255,176,32,.22), transparent 55%), radial-gradient(700px 360px at 80% 20%, rgba(122,162,247,.12), transparent 60%), linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,.02))";
}

export function ClientCover({
  url,
  initialCoverUrl,
}: {
  url: string;
  initialCoverUrl: string | null;
}) {
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);

  useEffect(() => {
    let cancelled = false;
    if (coverUrl) return;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 7000);

    fetch(`/api/preview?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: any) => {
        const img = typeof data?.imageUrl === "string" ? data.imageUrl : null;
        if (!cancelled && img) setCoverUrl(img);
      })
      .catch(() => {})
      .finally(() => clearTimeout(t));

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(t);
    };
  }, [url, coverUrl]);

  const style = useMemo(() => {
    if (coverUrl) {
      return {
        backgroundImage: `url(${coverUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } as const;
    }
    return { backgroundImage: fallbackGradient() } as const;
  }, [coverUrl]);

  return <div className="absolute inset-0" style={style} aria-hidden="true" />;
}

