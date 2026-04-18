import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    googleId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    picture: { type: String, default: "" },
    accessToken: { type: String, required: true, select: false },
    refreshToken: { type: String, required: true, select: false },
    tokenExpiry: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
