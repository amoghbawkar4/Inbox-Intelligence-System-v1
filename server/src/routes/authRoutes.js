import express from "express";
import User from "../models/User.js";
import {
  exchangeCodeForTokens,
  getGoogleAuthUrl
} from "../services/googleOAuth.js";
import { clearAuthCookie, setAuthCookie, signAuthToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/google", (req, res, next) => {
  try {
    res.redirect(getGoogleAuthUrl());
  } catch (error) {
    next(error);
  }
});

router.get("/google/callback", async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ message: "Missing authorization code" });
    }

    const { tokens, profile } = await exchangeCodeForTokens(code);

    const existingUser = await User.findOne({ googleId: profile.id }).select(
      "+refreshToken"
    );
    const refreshToken = tokens.refresh_token || existingUser?.refreshToken;

    if (!tokens.access_token || !refreshToken) {
      return res.status(400).json({
        message:
          "Google did not return a refresh token. Revoke access and try signing in again."
      });
    }

    const user = await User.findOneAndUpdate(
      { googleId: profile.id },
      {
        email: profile.email,
        googleId: profile.id,
        name: profile.name || "",
        picture: profile.picture || "",
        accessToken: tokens.access_token,
        refreshToken,
        tokenExpiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : new Date(Date.now() + 55 * 60 * 1000)
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    setAuthCookie(res, signAuthToken(user));
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard`);
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture
    }
  });
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
});

export default router;
