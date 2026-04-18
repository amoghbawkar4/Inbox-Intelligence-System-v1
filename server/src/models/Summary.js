import mongoose from "mongoose";

const summarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    emailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Email",
      required: true,
      index: true
    },
    tldr: { type: String, required: true },
    why_it_matters: { type: String, required: true },
    category: {
      type: String,
      enum: ["Urgent", "Read Later", "Ignore"],
      required: true,
      index: true
    },
    action: { type: String, required: true }
  },
  { timestamps: true }
);

summarySchema.index({ userId: 1, emailId: 1 }, { unique: true });

export default mongoose.model("Summary", summarySchema);
