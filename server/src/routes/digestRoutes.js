import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendDailyDigest } from "../services/digestService.js";

const router = express.Router();

router.post("/send", requireAuth, async (req, res, next) => {
  try {
    const sent = await sendDailyDigest(req.user);
    res.json({ message: "Digest sent", gmailMessageId: sent.id });
  } catch (error) {
    next(error);
  }
});

export default router;
