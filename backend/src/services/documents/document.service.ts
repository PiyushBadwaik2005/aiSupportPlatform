import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { Document, IDocument } from "../../models/Document";
import { DocumentChunk } from "../../models/DocumentChunk";
import { documentLoaderService } from "../ai/document-loader.service";
import { chunkingService } from "../ai/chunking.service";
import { embeddingService } from "../ai/embedding.service";
import { logger } from "../../utils/logger";

export class DocumentService {
  /**
   * Process a newly uploaded or replaced document through ingestion pipeline
   */
  async processDocument(documentId: string): Promise<IDocument> {
    const doc = await Document.findById(documentId);
    if (!doc) {
      throw new Error(`Document not found with ID ${documentId}`);
    }

    doc.status = "processing";
    doc.errorMessage = undefined;
    await doc.save();

    try {
      // 1. Extract text
      const extracted = await documentLoaderService.loadFromFile(doc.storagePath, doc.fileType);

      if (!extracted.totalText || extracted.totalText.trim().length === 0) {
        throw new Error("Extracted document text is empty.");
      }

      // 2. Chunk text using LangChain splitter
      const chunks = await chunkingService.chunkDocument(extracted, {
        documentTitle: doc.title,
        originalFilename: doc.originalFilename,
        fileType: doc.fileType,
      });

      if (chunks.length === 0) {
        throw new Error("No usable chunks could be generated from document.");
      }

      // 3. Invalidate/delete any existing chunks for this document (e.g. on re-process or replace)
      await DocumentChunk.deleteMany({ documentId: doc._id });

      // 4. Generate embeddings if configured
      let embeddings: number[][] = [];
      if (embeddingService.isConfigured()) {
        try {
          embeddings = await embeddingService.generateEmbeddings(chunks.map((c) => c.content));
        } catch (embedErr: any) {
          logger.warn("Embedding generation failed during ingestion; storing chunks without vectors", {
            error: embedErr.message,
          });
        }
      }

      // 5. Store chunks in MongoDB
      const chunkDocs = chunks.map((chunk, idx) => ({
        businessId: doc.businessId,
        documentId: doc._id,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        page: chunk.page,
        embedding: embeddings[idx] || undefined,
        metadata: chunk.metadata,
      }));

      await DocumentChunk.insertMany(chunkDocs);

      // 6. Mark document as Ready
      doc.status = "ready";
      doc.chunkCount = chunks.length;
      doc.wordCount = extracted.wordCount;
      await doc.save();

      logger.info("Document processed and indexed successfully", {
        documentId: doc._id,
        title: doc.title,
        chunks: chunks.length,
      });

      return doc;
    } catch (err: any) {
      logger.error("Document processing failed", {
        documentId: doc._id,
        error: err.message,
      });

      doc.status = "failed";
      doc.errorMessage = err.message || "Failed to process document content.";
      await doc.save();
      throw err;
    }
  }

  /**
   * Replace an existing document with a new file
   */
  async replaceDocument(
    documentId: string,
    businessId: string,
    newFile: { originalname: string; path: string; size: number; mimetype: string }
  ): Promise<IDocument> {
    const doc = await Document.findOne({
      _id: new mongoose.Types.ObjectId(documentId),
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!doc) {
      throw new Error("Document not found or access denied.");
    }

    // Safely remove previous physical file
    try {
      await fs.unlink(doc.storagePath);
    } catch (unlinkErr) {
      // Ignore if file was already removed
    }

    // Determine file type
    const ext = path.extname(newFile.originalname).toLowerCase().replace(".", "");
    const fileType = ext === "docx" ? "docx" : ext === "txt" ? "txt" : "pdf";

    doc.originalFilename = newFile.originalname;
    doc.fileType = fileType;
    doc.fileSize = newFile.size;
    doc.storagePath = newFile.path;
    doc.status = "pending";
    doc.version += 1;
    await doc.save();

    // Trigger re-processing
    await this.processDocument((doc._id as any).toString());
    return doc;
  }

  /**
   * Delete a document and its chunks
   */
  async deleteDocument(documentId: string, businessId: string): Promise<boolean> {
    const doc = await Document.findOne({
      _id: new mongoose.Types.ObjectId(documentId),
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!doc) {
      throw new Error("Document not found or access denied.");
    }

    // 1. Delete all chunks from DB (prevents future retrieval)
    await DocumentChunk.deleteMany({ documentId: doc._id });

    // 2. Delete file from storage
    try {
      await fs.unlink(doc.storagePath);
    } catch (err) {
      // Ignore disk unlink error
    }

    // 3. Delete document record
    await Document.deleteOne({ _id: doc._id });

    logger.info("Document and associated chunks deleted", { documentId, businessId });
    return true;
  }
}

export const documentService = new DocumentService();

