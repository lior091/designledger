import { fetchUrlPreview } from "@/lib/preview/fetchPreview";
import { fetchArticleText } from "@/lib/preview/fetchArticleText";

function compressWhitespace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

async function generateViaRapidApi(url: string) {
  const key = process.env.RAPIDAPI_TLDR_KEY;
  if (!key) return null;

  // RapidAPI "tldr-text-analysis" (freemium). We use URL input and ask for more sentences.
  const endpoint = "https://tldr-text-analysis.p.rapidapi.com/summarize/";
  const qs = new URLSearchParams({
    text: url,
    max_sentences: String(Number(process.env.RAPIDAPI_TLDR_MAX_SENTENCES || 12)),
  });

  const res = await fetch(`${endpoint}?${qs.toString()}`, {
    method: "GET",
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": "tldr-text-analysis.p.rapidapi.com",
    },
  });

  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as any;

  // Defensive parsing across possible response shapes.
  const raw =
    data?.summary ||
    data?.result?.summary ||
    data?.data?.summary ||
    data?.output ||
    data?.text ||
    null;

  if (typeof raw !== "string") return null;
  const cleaned = compressWhitespace(raw);
  return cleaned || null;
}

function looksLikeBulletsOrEnumerations(s: string) {
  return /(^|\s)([-*•]\s|(\d+|[a-zA-Z])[\.\)]\s)/m.test(s);
}

function stripCommonDisclaimers(s: string) {
  // Keep this conservative; we mainly want to remove obvious LLM boilerplate.
  return s
    .replace(/as an ai language model[^\.\n]*[.\n]*/gi, "")
    .replace(/i (can('|’)t|cannot) (browse|access)[^\.\n]*[.\n]*/gi, "")
    .replace(/this (article|post) (talks|discusses|explores)[^\.\n]*[.\n]*/gi, "")
    .replace(/\b(in conclusion|to conclude|overall)\b[:\s-]*/gi, "")
    .trim();
}

async function ollamaGenerate(params: {
  model: string;
  prompt: string;
  temperature?: number;
}) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      stream: false,
      options: {
        temperature: params.temperature ?? 0.2,
      },
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as any;
  const text = typeof data?.response === "string" ? data.response : null;
  return text ? text.trim() : null;
}

async function generateViaOllama(params: {
  url: string;
  title: string;
  description: string;
  researchSummary: string;
  articleText: string;
}) {
  const model = process.env.OLLAMA_MODEL || "llama3.2:latest";
  const maxChars = Number(process.env.TLDR_MAX_CHARS || 2200); // ~300-350 words

  const context = [
    `URL: ${params.url}`,
    `Title: ${params.title}`,
    params.description ? `Description: ${params.description}` : "",
    params.researchSummary ? `ResearchSummary: ${params.researchSummary}` : "",
    "",
    "ArticleText:",
    params.articleText || "(empty)",
  ]
    .filter(Boolean)
    .join("\n");

  const prompt1 = [
    "Write a concise TL;DR of the content below.",
    "Rules:",
    "- Output a single paragraph (no bullet points, no numbering, no headings).",
    "- No disclaimers, no references to 'the article' or 'this post'.",
    "- Concrete and actionable; keep the signal.",
    `- Hard limit: ${maxChars} characters (truncate if needed).`,
    "",
    context,
  ].join("\n");

  const first = await ollamaGenerate({ model, prompt: prompt1, temperature: 0.2 });
  if (!first) return null;

  const cleaned1 = stripCommonDisclaimers(compressWhitespace(first)).slice(0, maxChars);
  if (!looksLikeBulletsOrEnumerations(cleaned1) && cleaned1.length > 80) return cleaned1;

  const prompt2 = [
    "Rewrite the TL;DR below into a single paragraph.",
    "Rules:",
    "- Remove bullet points, numbering, and headings.",
    "- Remove any disclaimers or meta commentary.",
    "- Keep meaning; make it read like a confident summary.",
    `- Hard limit: ${maxChars} characters (truncate if needed).`,
    "",
    "TL;DR to rewrite:",
    cleaned1,
  ].join("\n");

  const second = await ollamaGenerate({ model, prompt: prompt2, temperature: 0.15 });
  if (!second) return cleaned1;

  const cleaned2 = stripCommonDisclaimers(compressWhitespace(second)).slice(0, maxChars);
  return cleaned2 || cleaned1;
}

export async function generateTldr(params: {
  url: string;
  title: string;
  researchSummary: string;
}): Promise<string> {
  const { url, title, researchSummary } = params;

  const provider = process.env.AI_PROVIDER || "mock";

  // Free-tier API option (no model hosting): RapidAPI summarization.
  // Enable by setting: AI_PROVIDER=rapidapi and RAPIDAPI_TLDR_KEY=...
  if (provider === "rapidapi") {
    const out = await generateViaRapidApi(url);
    return out ?? "TL;DR generation failed (RapidAPI not configured or error).";
  }

  // Local, free option: Ollama (inspired by https://github.com/Dan-Duran/tldr)
  // Enable by setting: AI_PROVIDER=ollama and having Ollama running.
  if (provider === "ollama") {
    const preview = await fetchUrlPreview(url);
    const article = await fetchArticleText(url);
    const articleText =
      article.text.length > 12000 ? `${article.text.slice(0, 12000)}…` : article.text;

    const out = await generateViaOllama({
      url,
      title: title || preview.title || url,
      description: preview.description || "",
      researchSummary: researchSummary || "",
      articleText,
    });
    return out ?? "TL;DR generation failed (Ollama not reachable or error).";
  }

  if (provider !== "openai") {
    return "TL;DR unavailable (set AI_PROVIDER=ollama, AI_PROVIDER=openai, or AI_PROVIDER=rapidapi).";
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return "TL;DR unavailable (OPENAI_API_KEY is not set).";
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const preview = await fetchUrlPreview(url);
  const article = await fetchArticleText(url);

  // Keep token budget sane. 12k chars is usually plenty.
  const articleText =
    article.text.length > 12000 ? `${article.text.slice(0, 12000)}…` : article.text;

  const input = {
    url,
    title: title || preview.title || url,
    description: preview.description || "",
    researchSummary: researchSummary || "",
    articleText,
  };

  const system = [
    "You write TL;DR summaries for design/research links.",
    "Return ONLY plain text, no markdown, no bullets that look like markdown.",
    "Constraints:",
    "- Target length: ~300 words (between 240 and 340 words).",
    "- Concrete, non-hype, actionable framing.",
    "- Avoid repeating the title verbatim.",
    "- If articleText is empty or too thin, be explicit about uncertainty and lean on description/researchSummary.",
    "",
    "Output format (plain text):",
    "Start with a one-line TL;DR headline (max 14 words).",
    "Then 2 short paragraphs.",
    "Then 4 'Takeaway:' lines (each one sentence).",
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
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    }),
  });

  if (!res.ok) {
    return "TL;DR generation failed (OpenAI request error).";
  }

  const data = (await res.json()) as any;
  const content = data?.choices?.[0]?.message?.content;
  const tldr = typeof content === "string" ? content.trim() : "";

  const cleaned = compressWhitespace(tldr);
  if (!cleaned) {
    return "TL;DR generation failed (empty model response).";
  }
  return cleaned;
}

