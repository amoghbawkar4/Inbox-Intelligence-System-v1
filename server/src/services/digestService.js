import { getUserSummaries, processUnprocessedEmails } from "./summaryService.js";
import { sendDigestEmail } from "./gmailService.js";

export function formatDigest(summaries) {
  if (!summaries.length) {
    return [
      "Smart Newsletter Digest",
      "",
      "No new high-value newsletters were summarized today."
    ].join("\n");
  }

  const sections = summaries.map((summary, index) => {
    const email = summary.emailId || {};
    return [
      `${index + 1}. ${email.subject || "Newsletter"}`,
      `From: ${email.sender || "Unknown sender"}`,
      `Category: ${summary.category}`,
      `TL;DR: ${summary.tldr}`,
      `Why it matters: ${summary.why_it_matters}`,
      `Suggested action: ${summary.action}`
    ].join("\n");
  });

  return ["Smart Newsletter Digest", "", ...sections].join("\n\n");
}

export async function sendDailyDigest(user) {
  await processUnprocessedEmails(user, 20);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const summaries = await getUserSummaries(user._id);
  const recent = summaries.filter((summary) => summary.createdAt >= since);
  const digest = formatDigest(recent);
  return sendDigestEmail(user, digest);
}
