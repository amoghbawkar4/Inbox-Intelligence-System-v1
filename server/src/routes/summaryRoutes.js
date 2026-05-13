import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getUserSummaries,
  clearUserSummaries
} from "../services/summaryService.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const summaries = await getUserSummaries(
      req.user._id,
      req.query.category
    );
    res.json({ summaries });
  } catch (error) {
    next(error);
  }
});

router.delete("/clear", requireAuth, async (req, res, next) => {
  try {
    const deletedCount = await clearUserSummaries(
      req.user._id,
      req.query.filter
    );

    res.json({
      message: "Summaries cleared successfully",
      deletedCount
    });
  } catch (error) {
    next(error);
  }
});

export default router;