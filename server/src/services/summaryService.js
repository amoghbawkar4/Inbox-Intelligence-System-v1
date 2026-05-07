import Email from "../models/Email.js";
import Summary from "../models/Summary.js";
import { summarizeEmail } from "./openaiService.js";
import { analyzeEmailHeuristics } from "./contentCleaner.js";

export async function processUnprocessedEmails(user, limit = 10) {
  const emails = await Email.find({
    userId: user._id,
    processed: false
  })
    .sort({ receivedAt: -1, createdAt: -1 })
    .limit(limit);

  const summaries = [];

  const batchSize = 5;

for (let i = 0; i < emails.length; i += batchSize) {
  const batch = emails.slice(i, i + batchSize);

  const batchResults = await Promise.all(
    batch.map(async (email) => {
      const heuristics = analyzeEmailHeuristics({
        subject: email.subject,
        sender: email.sender,
        content: email.cleaned_content
      });

  const result = await summarizeEmail(email, heuristics);

      const summary = await Summary.findOneAndUpdate(
        {
          userId: user._id,
          emailId: email._id
        },
        {
          userId: user._id,
          emailId: email._id,
          ...result
        },
        {
          upsert: true,
          new: true
        }
      );

      email.processed = true;
      await email.save();

      return summary;
    })
  );

  summaries.push(...batchResults);
}

  return summaries;
}

export async function getUserSummaries(userId, category) {
  const query = { userId };
  if (category && ["Urgent", "Read Later", "Ignore"].includes(category)) {
    query.category = category;
  }

  return Summary.find(query)
    .populate("emailId", "subject sender snippet receivedAt")
    .sort({ createdAt: -1 })
    .limit(100);
}
