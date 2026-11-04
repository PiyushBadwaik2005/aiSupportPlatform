import mongoose from "mongoose";
import { Document } from "../../models/Document";
import { DocumentChunk } from "../../models/DocumentChunk";
import { SearchChunkResult } from "../../types";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { cosineSimilarity, embeddingService } from "./embedding.service";
import { IRetrievalService, RetrievalOptions } from "./interfaces";

export class RetrievalService implements IRetrievalService {
  /**
   * Main retrieval method that delegates to keyword, vector, or hybrid
   */
  async retrieve(options: RetrievalOptions): Promise<SearchChunkResult[]> {
    const {
      businessId,
      query,
      limit = env.RAG_MAX_RETRIEVED_CHUNKS,
      minScore = env.RAG_MIN_RELEVANCE_SCORE,
      mode = env.RAG_RETRIEVAL_MODE,
    } = options;

    if (!query || query.trim().length === 0) {
      return [];
    }

    // Step 1: Find all Ready documents for this business to ensure we never retrieve from pending/failed/deleted docs
    const readyDocs = await Document.find({
      businessId: new mongoose.Types.ObjectId(businessId),
      status: "ready",
    }).select("_id title");

    if (readyDocs.length === 0) {
      logger.info("No ready documents found for business", { businessId });
      return [];
    }

    const readyDocIds = readyDocs.map((d) => d._id);

    try {
      if (mode === "vector" && embeddingService.isConfigured()) {
        return await this.vectorSearch(businessId, readyDocIds, query, limit, minScore);
      } else if (mode === "hybrid" && embeddingService.isConfigured()) {
        return await this.hybridSearch(businessId, readyDocIds, query, limit, minScore);
      } else {
        // Keyword search (default and reliable fallback)
        return await this.keywordSearch(businessId, readyDocIds, query, limit, minScore);
      }
    } catch (err: any) {
      logger.warn("Primary retrieval failed, falling back to keyword search", {
        mode,
        error: err.message,
      });
      return await this.keywordSearch(businessId, readyDocIds, query, limit, minScore);
    }
  }

  /**
   * Keyword search utilizing MongoDB text index and term frequency matching
   */
  async keywordSearch(
    businessId: string,
    readyDocIds: mongoose.Types.ObjectId[],
    query: string,
    limit: number,
    minScore: number
  ): Promise<SearchChunkResult[]> {
    const cleanQuery = query.trim();
    const queryTokens = cleanQuery
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2);

    if (queryTokens.length === 0) {
      return [];
    }

    // Find all chunks belonging to ready documents of this business
    // We use a regex match on content to fetch candidate chunks
    const regexPattern = queryTokens.map((t) => `(?=.*\\b${t})`).join("") || queryTokens.join("|");
    
    // First try full match or any-token match
    const chunks = await DocumentChunk.find({
      businessId: new mongoose.Types.ObjectId(businessId),
      documentId: { $in: readyDocIds },
      $or: [
        { content: { $regex: queryTokens.join("|"), $options: "i" } },
        { "metadata.documentTitle": { $regex: queryTokens.join("|"), $options: "i" } },
      ],
    }).limit(limit * 3);

    // Compute BM25/TF-IDF inspired keyword relevance score for each chunk
    const scoredChunks: SearchChunkResult[] = [];

    for (const chunk of chunks) {
      const contentLower = chunk.content.toLowerCase();
      const titleLower = (chunk.metadata?.documentTitle || "").toLowerCase();

      let matchedTokens = 0;
      let tokenFrequency = 0;

      for (const token of queryTokens) {
        if (contentLower.includes(token) || titleLower.includes(token)) {
          matchedTokens++;
          // Count occurrences
          const occurrences = (contentLower.match(new RegExp(token, "g")) || []).length;
          tokenFrequency += occurrences;
        }
      }

      if (matchedTokens === 0) continue;

      // Score based on token coverage (breadth) + frequency (density)
      const coverage = matchedTokens / queryTokens.length;
      const density = Math.min(tokenFrequency / 10, 1);
      const score = Math.round((coverage * 0.7 + density * 0.3) * 100) / 100;

      if (score >= minScore) {
        scoredChunks.push({
          chunkId: (chunk._id as any).toString(),
          documentId: (chunk.documentId as any).toString(),
          documentTitle: chunk.metadata?.documentTitle || "Untitled Document",
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          page: chunk.page,
          score,
          metadata: chunk.metadata,
        });
      }
    }

    // Sort descending by score
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, limit);
  }

  /**
   * Vector search with cosine similarity (or Atlas Vector Search when available)
   */
  async vectorSearch(
    businessId: string,
    readyDocIds: mongoose.Types.ObjectId[],
    query: string,
    limit: number,
    minScore: number
  ): Promise<SearchChunkResult[]> {
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // Fetch chunks with embeddings
    const chunks = await DocumentChunk.find({
      businessId: new mongoose.Types.ObjectId(businessId),
      documentId: { $in: readyDocIds },
      embedding: { $exists: true, $ne: [] },
    }).select("_id documentId chunkIndex content page embedding metadata");

    const scored: SearchChunkResult[] = [];

    for (const chunk of chunks) {
      if (!chunk.embedding || chunk.embedding.length === 0) continue;

      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (score >= minScore) {
        scored.push({
          chunkId: (chunk._id as any).toString(),
          documentId: (chunk.documentId as any).toString(),
          documentTitle: chunk.metadata?.documentTitle || "Untitled Document",
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          page: chunk.page,
          score: Math.round(score * 100) / 100,
          metadata: chunk.metadata,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Hybrid search: Combines normalized keyword and vector scores (Reciprocal Rank Fusion / weighted sum)
   */
  async hybridSearch(
    businessId: string,
    readyDocIds: mongoose.Types.ObjectId[],
    query: string,
    limit: number,
    minScore: number
  ): Promise<SearchChunkResult[]> {
    const [keywordResults, vectorResults] = await Promise.all([
      this.keywordSearch(businessId, readyDocIds, query, limit * 2, 0.1),
      this.vectorSearch(businessId, readyDocIds, query, limit * 2, 0.1),
    ]);

    const combinedMap = new Map<string, SearchChunkResult>();

    for (const item of keywordResults) {
      combinedMap.set(item.chunkId, {
        ...item,
        score: item.score * 0.5,
      });
    }

    for (const item of vectorResults) {
      const existing = combinedMap.get(item.chunkId);
      if (existing) {
        existing.score = Math.round((existing.score + item.score * 0.5) * 100) / 100;
      } else {
        combinedMap.set(item.chunkId, {
          ...item,
          score: Math.round(item.score * 0.5 * 100) / 100,
        });
      }
    }

    const merged = Array.from(combinedMap.values()).filter((c) => c.score >= minScore);
    merged.sort((a, b) => b.score - a.score);
    return merged.slice(0, limit);
  }
}

export const retrievalService = new RetrievalService();

