import mongoose, { Document as MDocument, Schema } from "mongoose";

export interface IConversation extends MDocument {
  businessId: mongoose.Types.ObjectId;
  sessionId: string;
  source: "playground" | "widget" | "api";
  title?: string;
  messageCount: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    source: {
      type: String,
      enum: ["playground", "widget", "api"],
      default: "playground",
    },
    title: { type: String, default: "New Conversation" },
    messageCount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ConversationSchema.index({ businessId: 1, createdAt: -1 });

export const Conversation = mongoose.model<IConversation>("Conversation", ConversationSchema);

