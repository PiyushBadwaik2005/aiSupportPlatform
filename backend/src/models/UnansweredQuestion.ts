import mongoose, { Document as MDocument, Schema } from "mongoose";

export interface IUnansweredQuestion extends MDocument {
  businessId: mongoose.Types.ObjectId;
  question: string;
  conversationId?: mongoose.Types.ObjectId;
  status: "open" | "resolved" | "ignored";
  relevanceScore?: number;
  reason?: string;
  notes?: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UnansweredQuestionSchema = new Schema<IUnansweredQuestion>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    question: { type: String, required: true, trim: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    status: {
      type: String,
      enum: ["open", "resolved", "ignored"],
      default: "open",
      index: true,
    },
    relevanceScore: { type: Number, default: 0 },
    reason: { type: String, default: "insufficient_evidence" },
    notes: { type: String },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

UnansweredQuestionSchema.index({ businessId: 1, status: 1, createdAt: -1 });

export const UnansweredQuestion = mongoose.model<IUnansweredQuestion>(
  "UnansweredQuestion",
  UnansweredQuestionSchema
);

