import mongoose, { Document as MDocument, Schema } from "mongoose";

export interface IDocument extends MDocument {
  businessId: mongoose.Types.ObjectId;
  title: string;
  originalFilename: string;
  fileType: "pdf" | "docx" | "txt";
  fileSize: number;
  storagePath: string;
  status: "pending" | "processing" | "ready" | "failed";
  errorMessage?: string;
  chunkCount: number;
  wordCount: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    title: { type: String, required: true, trim: true },
    originalFilename: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "docx", "txt"], required: true },
    fileSize: { type: Number, required: true },
    storagePath: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "ready", "failed"],
      default: "pending",
      index: true,
    },
    errorMessage: { type: String },
    chunkCount: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

DocumentSchema.index({ businessId: 1, status: 1 });
DocumentSchema.index({ businessId: 1, createdAt: -1 });

export const Document = mongoose.model<IDocument>("Document", DocumentSchema);

