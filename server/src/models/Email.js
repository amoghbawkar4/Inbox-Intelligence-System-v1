import mongoose from "mongoose";

const emailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    gmailMessageId: { type: String, required: true },
    threadId: { type: String, default: "" },
    subject: { type: String, default: "(No subject)" },
    sender: { type: String, default: "" },
    cleaned_content: { type: String, required: true },
    snippet: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "pending",
        "cleaned",
        "summarized",
        "failed",
        "skipped"
      ],
    default: "pending",
    index: true
},
    receivedAt: { type: Date }
  },
  { timestamps: true }
);

emailSchema.index({ userId: 1, gmailMessageId: 1 }, { unique: true });

export default mongoose.model("Email", emailSchema);
