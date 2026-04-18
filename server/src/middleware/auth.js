import User from "../models/User.js";
import { COOKIE_NAME, verifyAuthToken } from "../utils/jwt.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.sub).select(
      "+accessToken +refreshToken"
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}
