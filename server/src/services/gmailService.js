import { google } from "googleapis";
import Email from "../models/Email.js";
import { getValidAccessToken, getOAuthClient } from "./googleOAuth.js";
import { cleanEmailContent, analyzeEmailHeuristics } from "./contentCleaner.js";
import { encodeRawEmail, extractBody, getHeader } from "../utils/gmail.js";

function getGmailClient(accessToken) {
  const auth = getOAuthClient();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export async function fetchRecentInboxEmails(user, options = {}) {
  const maxResults = Number(options.maxResults || 10);
  const accessToken = await getValidAccessToken(user);
  const gmail = getGmailClient(accessToken);

  const { data: list } = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    q: "newer_than:7d",
    maxResults
  });

  const messages = list.messages || [];
  const saved = [];
  const skipped = [];

  for (const message of messages) {
    const existing = await Email.findOne({
      userId: user._id,
      gmailMessageId: message.id
    });

    if (existing) {
      skipped.push({ gmailMessageId: message.id, reason: "duplicate" });
      continue;
    }

    const { data: fullMessage } = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "full"
    });

    const headers = fullMessage.payload?.headers || [];
    const subject = getHeader(headers, "Subject") || "(No subject)";
    const sender = getHeader(headers, "From");
    const rawBody = extractBody(fullMessage.payload);
    const cleaned = cleanEmailContent(rawBody);

    if (isLowValueEmail({ subject, sender, content: cleaned })) {
      skipped.push({ gmailMessageId: message.id, reason: "low_value" });
      continue;
    }

    const email = await Email.create({
      userId: user._id,
      gmailMessageId: fullMessage.id,
      threadId: fullMessage.threadId,
      subject,
      sender,
      cleaned_content: cleaned,
      snippet: fullMessage.snippet || "",
      receivedAt: fullMessage.internalDate
        ? new Date(Number(fullMessage.internalDate))
        : undefined
    });

    saved.push(email);
  }

  return { saved, skipped };
}

export async function sendDigestEmail(user, digestText) {
  const accessToken = await getValidAccessToken(user);
  const gmail = getGmailClient(accessToken);
  const raw = encodeRawEmail({
    to: user.email,
    from: user.email,
    subject: "Your Smart Newsletter Digest",
    text: digestText
  });

  const { data } = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw }
  });

  return data;
}
