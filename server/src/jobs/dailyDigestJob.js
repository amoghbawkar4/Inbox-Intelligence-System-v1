import cron from "node-cron";
import User from "../models/User.js";
import { fetchRecentInboxEmails } from "../services/gmailService.js";
import { sendDailyDigest } from "../services/digestService.js";

export function startDailyDigestJob() {
  const schedule = process.env.CRON_SCHEDULE || "0 8 * * *";

  cron.schedule(schedule, async () => {
    console.log("Daily digest job started");
    const users = await User.find({}).select("+accessToken +refreshToken");

    for (const user of users) {
      try {
        await fetchRecentInboxEmails(user, { maxResults: 20 });
        await sendDailyDigest(user);
        console.log(`Daily digest sent for ${user.email}`);
      } catch (error) {
        console.error(`Daily digest failed for ${user.email}`, error.message);
      }
    }
  });
}
