import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { Document } from "../src/models/Document";
import { DocumentChunk } from "../src/models/DocumentChunk";
import { documentLoaderService } from "../src/services/ai/document-loader.service";
import { chunkingService } from "../src/services/ai/chunking.service";
import { documentService } from "../src/services/documents/document.service";
import { documentController } from "../src/controllers/document.controller";
import { createMockResponse } from "./helpers";

describe("Document Ingestion & Pipeline (Tests 4, 5, 6, 12, 13)", () => {
  const businessId = "65f011111111111111111111";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("4. Valid TXT document is parsed and extracts clean normalized text", async () => {
    const txtBuffer = Buffer.from("Acme standard refund policy: 30 days return window. Full refund guaranteed.");
    const result = await documentLoaderService.loadFromBuffer(txtBuffer, "txt");

    expect(result.totalText).toContain("Acme standard refund policy");
    expect(result.wordCount).toBeGreaterThan(5);
    expect(result.pages.length).toBe(1);
  });

  it("5. Malformed or unsupported file uploads are rejected", async () => {
    const req: any = {
      file: undefined, // no file passed or rejected by upload filter
      user: { businessId },
    };
    const res = createMockResponse();

    await documentController.upload(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("No file uploaded");
  });

  it("6. Text extraction and chunking preserve document metadata", async () => {
    const extracted = {
      pages: [
        { text: "Page 1: Our enterprise pricing plan begins at $49/month with unlimited seats.", page: 1 },
        { text: "Page 2: Standard support is included with 24-hour response SLAs.", page: 2 },
      ],
      totalText: "Pricing and support documentation",
      wordCount: 22,
    };

    const chunks = await chunkingService.chunkDocument(extracted, {
      documentTitle: "Enterprise Terms",
      originalFilename: "terms.pdf",
      fileType: "pdf",
    });

    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].metadata.documentTitle).toBe("Enterprise Terms");
    expect(chunks[0].metadata.originalFilename).toBe("terms.pdf");
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].page).toBeDefined();
  });

  it("12. Document replacement invalidates old indexed chunks", async () => {
    const docId = new mongoose.Types.ObjectId();
    const mockDoc = {
      _id: docId,
      businessId: new mongoose.Types.ObjectId(businessId),
      title: "Policy",
      originalFilename: "old_policy.txt",
      fileType: "txt",
      fileSize: 100,
      storagePath: "./uploads/test.txt",
      status: "ready",
      version: 1,
      save: vi.fn(),
    };

    vi.spyOn(Document, "findOne").mockResolvedValueOnce(mockDoc as any);
    vi.spyOn(Document, "findById").mockResolvedValueOnce(mockDoc as any);
    const deleteManySpy = vi.spyOn(DocumentChunk, "deleteMany").mockResolvedValue({} as any);
    vi.spyOn(documentLoaderService, "loadFromFile").mockResolvedValueOnce({
      pages: [{ text: "New policy content with full details.", page: 1 }],
      totalText: "New policy content with full details.",
      wordCount: 7,
    });
    vi.spyOn(DocumentChunk, "insertMany").mockResolvedValue([] as any);

    await documentService.replaceDocument(
      docId.toString(),
      businessId,
      {
        originalname: "new_policy.txt",
        path: "./uploads/new_test.txt",
        size: 150,
        mimetype: "text/plain",
      }
    );

    // Old chunks must have been deleted/invalidated
    expect(deleteManySpy).toHaveBeenCalledWith({ documentId: docId });
    expect(mockDoc.version).toBe(2);
  });

  it("13. Document deletion removes document and deletes associated indexed chunks", async () => {
    const docId = new mongoose.Types.ObjectId();
    const mockDoc = {
      _id: docId,
      businessId: new mongoose.Types.ObjectId(businessId),
      storagePath: "./uploads/dummy.txt",
    };

    vi.spyOn(Document, "findOne").mockResolvedValueOnce(mockDoc as any);
    const deleteChunksSpy = vi.spyOn(DocumentChunk, "deleteMany").mockResolvedValue({} as any);
    const deleteDocSpy = vi.spyOn(Document, "deleteOne").mockResolvedValue({} as any);

    const deleted = await documentService.deleteDocument(docId.toString(), businessId);

    expect(deleted).toBe(true);
    expect(deleteChunksSpy).toHaveBeenCalledWith({ documentId: docId });
    expect(deleteDocSpy).toHaveBeenCalledWith({ _id: docId });
  });
});
