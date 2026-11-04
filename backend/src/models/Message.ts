import mongoose, { Document as MDocument, Schema } from "mongoose";

export interface IMessageCitation {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  snippet: string;
  page?: number;
  relevanceScore?: number;
}

export interface IMessage extends MDocument {
  conversationId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  role: "user" | "assistant" | "system";
  content: string;
  isAnswered: boolean;
  citations: IMessageCitation[];
  confidence: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageCitationSchema = new Schema(
  {
    documentId: { type: String, required: true },
    documentTitle: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    snippet: { type: String, required: true },
    page: { type: Number },
    relevanceScore: { type: Number },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    isAnswered: { type: Boolean, default: true },
    citations: { type: [MessageCitationSchema], default: [] },
    confidence: { type: Number, default: 1 },
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ businessId: 1, isAnswered: 1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);

