import OpenAI from "openai";
import { truncateForModel } from "./contentCleaner.js";

function fallbackEnabled() {
  return process.env.OPENAI_FALLBACK_ON_ERROR !== "false";
}

function getSentences(content) {
  return content
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function createFallbackSummary(email, reason = "OpenAI is unavailable") {
  const sentences = getSentences(email.cleaned_content);
  const preview = sentences.slice(0, 2).join(" ").slice(0, 500);
  const urgentSignals = /\b(deadline|urgent|today|tomorrow|launch|security|action required|breaking)\b/i;
  const ignoreSignals = /\b(sale|discount|coupon|free shipping|limited time|sponsored)\b/i;

  let category = "Read Later";
  if (urgentSignals.test(`${email.subject} ${email.cleaned_content}`)) {
    category = "Urgent";
  } else if (ignoreSignals.test(`${email.subject} ${email.cleaned_content}`)) {
    category = "Ignore";
  }

  return {
    tldr: preview || "This email needs a quick manual review.",
    why_it_matters:
      reason === "quota"
        ? "OpenAI quota is unavailable, so this local fallback used the email's opening content."
        : `${reason}, so this local fallback used the email's opening content.`,
    category,
    action:
      category === "Urgent"
        ? "Review this soon and decide whether it needs action."
        : "Read when you have time."
  };
}

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    if (fallbackEnabled()) return null;

    const error = new Error("OPENAI_API_KEY is required");
    error.status = 500;
    throw error;
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function summarizeEmail(email, heuristics = {}) {
  const client = getClient();
  const content = truncateForModel(
    email.cleaned_content,
    heuristics
  );

  if (!client) {
    return createFallbackSummary(email, "OPENAI_API_KEY is missing");
  }

  let completion;

  try {
    completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You summarize newsletters for a busy professional. Return only valid JSON with keys: tldr, why_it_matters, category, action. category must be one of Urgent, Read Later, Ignore."
        },
        {
          role: "user",
          content: `
          Subject: ${email.subject}
          Sender: ${email.sender}

          Heuristic Analysis:
          - Promotional Score: ${heuristics.promotionalScore}
          - Urgency Score: ${heuristics.urgencyScore}
          - Short Content: ${heuristics.shortContent}
          - Content Length: ${heuristics.contentLength}

          Email:
          ${content}
          `
        }
      ]
    });
  } catch (error) {
    const isQuotaError =
      error.status === 429 ||
      error.code === "insufficient_quota" ||
      error.type === "insufficient_quota";

    if (fallbackEnabled()) {
      return createFallbackSummary(email, isQuotaError ? "quota" : error.message);
    }

    const friendlyError = new Error(
      isQuotaError
        ? "OpenAI quota exceeded. Check your OpenAI billing and usage limits."
        : "OpenAI summarization failed."
    );
    friendlyError.status = isQuotaError ? 402 : error.status || 502;
    throw friendlyError;
  }

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);
  const allowed = ["Urgent", "Read Later", "Ignore"];

  return {
    tldr: String(parsed.tldr || "No TL;DR generated.").slice(0, 1000),
    why_it_matters: String(parsed.why_it_matters || "No rationale generated.").slice(0, 1000),
    category: allowed.includes(parsed.category) ? parsed.category : "Read Later",
    action: String(parsed.action || "Review when you have time.").slice(0, 1000)
  };
}
