import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { Document } from "../src/models/Document";
import { DocumentChunk } from "../src/models/DocumentChunk";
import { retrievalService } from "../src/services/ai/retrieval.service";
import { embeddingService } from "../src/services/ai/embedding.service";

describe("Retrieval Services & Tenant Isolation (Tests 7, 8, 20, 21)", () => {
  const businessAId = "65f011111111111111111111";
  const businessBId = "65f099999999999999999999";

  const readyDocA = {
    _id: new mongoose.Types.ObjectId("65f0aaaa1111111111111111"),
    title: "Company A Shipping Policy",
    businessId: new mongoose.Types.ObjectId(businessAId),
    status: "ready",
  };

  const chunkA = {
    _id: new mongoose.Types.ObjectId(),
    businessId: new mongoose.Types.ObjectId(businessAId),
    documentId: readyDocA._id,
    chunkIndex: 0,
    content: "Standard shipping takes 3-5 business days across the continental US.",
    metadata: { documentTitle: "Company A Shipping Policy" },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("7. Relevant chunks are retrieved for a user question", async () => {
    vi.spyOn(Document, "find").mockReturnValue({
      select: vi.fn().mockResolvedValue([readyDocA]),
    } as any);

    vi.spyOn(DocumentChunk, "find").mockReturnValue({
      limit: vi.fn().mockResolvedValue([chunkA]),
    } as any);

    const results = await retrievalService.retrieve({
      businessId: businessAId,
      query: "How long does shipping take?",
      limit: 5,
      minScore: 0.2,
      mode: "keyword",
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toContain("3-5 business days");
    expect(results[0].score).toBeGreaterThan(0.2);
  });

  it("8. Retrieval strictly excludes other businesses' documents", async () => {
    // When querying for Business B, ensure Business A's chunks are never returned
    const docFindSpy = vi.spyOn(Document, "find").mockReturnValue({
      select: vi.fn().mockResolvedValue([]), // No documents for Business B
    } as any);

    const results = await retrievalService.retrieve({
      businessId: businessBId,
      query: "What is your shipping policy?",
      limit: 5,
    });

    expect(results.length).toBe(0);
    expect(docFindSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: new mongoose.Types.ObjectId(businessBId),
        status: "ready",
      })
    );
  });

  it("20. Semantic retrieval fails safely when vector search is misconfigured", async () => {
    vi.spyOn(Document, "find").mockReturnValue({
      select: vi.fn().mockResolvedValue([readyDocA]),
    } as any);

    // Mock embedding service to throw an error simulating vector index misconfiguration
    vi.spyOn(embeddingService, "isConfigured").mockReturnValue(true);
    vi.spyOn(embeddingService, "generateEmbedding").mockRejectedValue(
      new Error("Atlas Vector Search index 'vector_index' is not defined")
    );

    // Mock fallback keyword search to still return results
    vi.spyOn(DocumentChunk, "find").mockReturnValue({
      limit: vi.fn().mockResolvedValue([chunkA]),
    } as any);

    const results = await retrievalService.retrieve({
      businessId: businessAId,
      query: "shipping policy",
      mode: "vector",
      minScore: 0.2,
    });

    // Successfully fell back to keyword search without crashing
    expect(results).toBeDefined();
    expect(results.length).toBe(1);
  });

  it("21. Keyword fallback works when explicitly enabled", async () => {
    vi.spyOn(Document, "find").mockReturnValue({
      select: vi.fn().mockResolvedValue([readyDocA]),
    } as any);

    vi.spyOn(DocumentChunk, "find").mockReturnValue({
      limit: vi.fn().mockResolvedValue([chunkA]),
    } as any);

    const results = await retrievalService.keywordSearch(
      businessAId,
      [readyDocA._id],
      "continental shipping",
      5,
      0.2
    );

    expect(results.length).toBe(1);
    expect(results[0].documentTitle).toBe("Company A Shipping Policy");
  });
});

