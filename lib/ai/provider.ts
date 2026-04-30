import { normalizeUrl } from "@/lib/artifacts/url";

export type MintCandidate = {
  url: string;
  title: string;
  researchSummary: string;
  coverPrompt: string;
  coverUrl: string | null;
};

export type AiProvider = {
  parseSlackText: (text: string) => Promise<MintCandidate[]>;
};

type ProviderKind = "mock" | "openai";

function extractUrls(text: string) {
  const matches = text.match(/https?:\/\/[^\s<>"')\]]+/g) ?? [];
  return matches
    .map((u) => u.replace(/[.,;:!?]+$/g, ""))
    .map((u) => normalizeUrl(u))
    .filter((u): u is string => Boolean(u));
}

function titleFromUrl(url: string) {
  try {
    const u = new URL(url);
    const pathBits = u.pathname.split("/").filter(Boolean);
    const last = pathBits[pathBits.length - 1] ?? u.host;
    const cleaned = decodeURIComponent(last)
      .replace(/[-_]+/g, " ")
      .replace(/\.(html|htm|pdf)$/i, "");
    const base =
      cleaned.length >= 6 ? cleaned : pathBits.slice(-2).join(" / ") || u.host;
    return base.slice(0, 80);
  } catch {
    return url.slice(0, 80);
  }
}

function coverPromptFromUrl(url: string) {
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    // ignore
  }
  return [
    "Abstract technical CD cover, neo-industrial, schematic vector lines,",
    "monoline strokes, glass + steel textures, high contrast,",
    "warm amber accent on deep black, minimal typography, no logos,",
    `inspired by: ${host}`,
  ].join(" ");
}

export const mockAiProvider: AiProvider = {
  async parseSlackText(text: string) {
    const urls = extractUrls(text);
    const unique = Array.from(new Set(urls));
    return unique.map((url) => ({
      url,
      title: titleFromUrl(url),
      researchSummary:
        "A single-sentence insight will be generated here (mock provider).",
      coverPrompt: coverPromptFromUrl(url),
      coverUrl: null,
    }));
  },
};

const openaiAiProvider: AiProvider = {
  async parseSlackText(text: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    const system = [
      "You extract design-research artifacts from raw Slack text.",
      "Return ONLY valid JSON, no markdown.",
      'Schema: {"candidates":[{"url":string,"title":string,"researchSummary":string,"coverPrompt":string}]}',
      "Constraints:",
      "- Deduplicate URLs.",
      "- researchSummary is exactly one sentence, appsec UX 2030 tone, crisp and non-hype.",
      "- coverPrompt is ~20 words, neo-industrial schematic CD cover style, no logos, no text.",
      "- title is short (<= 80 chars).",
    ].join("\n");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenAI error (${res.status}): ${errText || res.statusText}`);
    }

    const data = (await res.json()) as any;
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("OpenAI response missing message content");
    }

    const parsed = JSON.parse(content) as { candidates?: unknown };
    const candidates = Array.isArray(parsed?.candidates) ? parsed.candidates : [];

    const cleaned = candidates
      .map((c: any) => {
        const rawUrl = typeof c?.url === "string" ? c.url : "";
        const url = normalizeUrl(rawUrl) || "";
        return {
          url,
          title: typeof c?.title === "string" ? c.title : "",
          researchSummary:
            typeof c?.researchSummary === "string" ? c.researchSummary : "",
          coverPrompt: typeof c?.coverPrompt === "string" ? c.coverPrompt : "",
          coverUrl: null,
        };
      })
      .filter((c) => c.url && c.title && c.researchSummary && c.coverPrompt);

    const seen = new Set<string>();
    return cleaned.filter((c) => {
      if (seen.has(c.url)) return false;
      seen.add(c.url);
      return true;
    });
  },
};

export function getAiProvider(): AiProvider {
  const kind = (process.env.AI_PROVIDER || "mock") as ProviderKind;
  if (kind === "openai") return openaiAiProvider;
  return mockAiProvider;
}

