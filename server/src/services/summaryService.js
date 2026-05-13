import Email from "../models/Email.js";
import Summary from "../models/Summary.js";
import { summarizeEmail } from "./openaiService.js";
import { analyzeEmailHeuristics } from "./contentCleaner.js";

export async function processUnprocessedEmails(user, limit = 10) {
  const emails = await Email.find({
    userId: user._id,
    status: "cleaned"
  })
    .sort({ receivedAt: -1, createdAt: -1 })
    .limit(limit);

  const summaries = [];

  const batchSize = 5;

for (let i = 0; i < emails.length; i += batchSize) {
  const batch = emails.slice(i, i + batchSize);

  const batchResults = await Promise.all(
    batch.map(async (email) => {
      try {
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

        email.status = "summarized";
        await email.save();

        return summary;

      } catch (error) {

        email.status = "failed";
        await email.save();

        console.error(
          `[SUMMARY FAILED] ${email.subject}`,
          error.message
        );

        return null;
      }
    })
  );

  const validResults = batchResults.filter(Boolean);

  summaries.push(...validResults);
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

export async function clearUserSummaries(userId, filter) {
  let dateFilter = null;

  const now = new Date();

  switch (filter) {
    case "24hrs":
      dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;

    case "7days":
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;

    case "month":
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;

    case "all":
      break;

    default:
      throw new Error("Invalid filter");
  }

  const query = { userId };

  if (dateFilter) {
    query.createdAt = { $gte: dateFilter };
  }

  const result = await Summary.deleteMany(query);

  return result.deletedCount;
}