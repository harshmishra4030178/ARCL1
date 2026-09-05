import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "General Broadcast",
    },
    emailSubject: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    channel: {
      type: String,
      enum: ["SMS", "EMAIL", "MULTI_CHANNEL"],
      default: "SMS",
    },
    targetAudiences: [
      {
        type: String,
      },
    ],
    totalRecipients: {
      type: Number,
      default: 0,
    },
    smsSuccessCount: {
      type: Number,
      default: 0,
    },
    smsFailedCount: {
      type: Number,
      default: 0,
    },
    emailSuccessCount: {
      type: Number,
      default: 0,
    },
    emailFailedCount: {
      type: Number,
      default: 0,
    },
    recipientNumbers: [
      {
        type: String,
        trim: true,
      },
    ],
    recipientEmails: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["sent", "partial", "failed", "pending"],
      default: "sent",
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

campaignSchema.index({ createdAt: -1 });

export default mongoose.model("Campaign", campaignSchema);
