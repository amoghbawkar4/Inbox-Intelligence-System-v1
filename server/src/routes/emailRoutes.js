import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { fetchRecentInboxEmails } from "../services/gmailService.js";
import { processUnprocessedEmails } from "../services/summaryService.js";

const router = express.Router();

router.post("/fetch", requireAuth, async (req, res, next) => {
  try {
    const maxResults = Math.min(Number(req.body?.maxResults || 10), 25);
    const result = await fetchRecentInboxEmails(req.user, { maxResults });
    res.json({
      saved: result.saved.length,
      skipped: result.skipped
    });
  } catch (error) {
    next(error);
  }
});

router.post("/process", requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.body?.limit || 10), 25);
    const summaries = await processUnprocessedEmails(req.user, limit);
    res.json({ processed: summaries.length, summaries });
  } catch (error) {
    next(error);
  }
});

router.post("/sync", requireAuth, async (req, res, next) => {
  try {
    const maxResults = Math.min(Number(req.body?.maxResults || 10), 25);
    const fetchResult = await fetchRecentInboxEmails(req.user, { maxResults });
    const summaries = await processUnprocessedEmails(req.user, maxResults);

    res.json({
      saved: fetchResult.saved.length,
      skipped: fetchResult.skipped,
      processed: summaries.length
    });
  } catch (error) {
    next(error);
  }
});

export default router;
