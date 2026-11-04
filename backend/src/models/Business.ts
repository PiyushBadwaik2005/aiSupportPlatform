import mongoose, { Document as MDocument, Schema } from "mongoose";

export interface IBusiness extends MDocument {
  name: string;
  slug: string;
  ownerId?: mongoose.Types.ObjectId;
  website?: string;
  settings: {
    defaultGreeting: string;
    fallbackMessage: string;
    minRelevanceScore: number;
    ragRetrievalMode: "keyword" | "vector" | "hybrid";
  };
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    website: { type: String, trim: true },
    settings: {
      defaultGreeting: {
        type: String,
        default: "Hello! How can I assist you today with our products and services?",
      },
      fallbackMessage: {
        type: String,
        default: "I couldn't find this information in the business's available documents. Please contact the business for confirmation.",
      },
      minRelevanceScore: { type: Number, default: 0.35, min: 0, max: 1 },
      ragRetrievalMode: {
        type: String,
        enum: ["keyword", "vector", "hybrid"],
        default: "keyword",
      },
    },
  },
  { timestamps: true }
);

export const Business = mongoose.model<IBusiness>("Business", BusinessSchema);

