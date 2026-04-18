import Email from "../models/Email.js";
import Summary from "../models/Summary.js";
import { summarizeEmail } from "./openaiService.js";

export async function processUnprocessedEmails(user, limit = 10) {
  const emails = await Email.find({
    userId: user._id,
    processed: false
  })
    .sort({ receivedAt: -1, createdAt: -1 })
    .limit(limit);

  const summaries = [];

  for (const email of emails) {
    const existing = await Summary.findOne({
      userId: user._id,
      emailId: email._id
    });

    if (existing) {
      email.processed = true;
      await email.save();
      summaries.push(existing);
      continue;
    }

    const result = await summarizeEmail(email);
    const summary = await Summary.create({
      userId: user._id,
      emailId: email._id,
      ...result
    });

    email.processed = true;
    await email.save();
    summaries.push(summary);
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
