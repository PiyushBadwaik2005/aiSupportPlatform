import mongoose, { Document as MDocument, Schema } from "mongoose";

export interface IDocumentChunk extends MDocument {
  businessId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  chunkIndex: number;
  content: string;
  page?: number;
  embedding?: number[];
  metadata: {
    documentTitle: string;
    originalFilename: string;
    fileType: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunk>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    page: { type: Number },
    embedding: { type: [Number], default: undefined },
    metadata: {
      documentTitle: { type: String, required: true },
      originalFilename: { type: String, required: true },
      fileType: { type: String, required: true },
    },
  },
  { timestamps: true }
);

DocumentChunkSchema.index({ businessId: 1, documentId: 1 });
DocumentChunkSchema.index({ businessId: 1, chunkIndex: 1 });
// Text index for keyword retrieval fallback
DocumentChunkSchema.index({ content: "text", "metadata.documentTitle": "text" });

export const DocumentChunk = mongoose.model<IDocumentChunk>("DocumentChunk", DocumentChunkSchema);

