import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { IEmbeddingService } from "./interfaces";

export class EmbeddingService implements IEmbeddingService {
  private client: GoogleGenerativeAIEmbeddings | null = null;
  private readonly dimensions = 768; // text-embedding-004 standard dimension

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
      try {
        this.client = new GoogleGenerativeAIEmbeddings({
          apiKey: env.GEMINI_API_KEY,
          modelName: env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
        });
      } catch (err: any) {
        logger.warn("Failed to initialize GoogleGenerativeAIEmbeddings", { error: err.message });
        this.client = null;
      }
    }
  }

  isConfigured(): boolean {
    return this.client !== null && Boolean(env.GEMINI_API_KEY);
  }

  getDimensions(): number {
    return this.dimensions;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isConfigured() || !this.client) {
      // Return deterministic normalized pseudo-embedding when unconfigured (e.g. tests)
      return this.generateDeterministicVector(text, this.dimensions);
    }

    try {
      return await this.client.embedQuery(text);
    } catch (err: any) {
      logger.error("Error generating embedding from Gemini API", { error: err.message });
      throw new Error(`Embedding generation failed: ${err.message}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.isConfigured() || !this.client) {
      return texts.map((t) => this.generateDeterministicVector(t, this.dimensions));
    }

    try {
      return await this.client.embedDocuments(texts);
    } catch (err: any) {
      logger.error("Error generating batch embeddings from Gemini API", { error: err.message });
      throw new Error(`Batch embedding generation failed: ${err.message}`);
    }
  }

  /**
   * Deterministic feature-hash vector for mock/offline testing
   */
  private generateDeterministicVector(text: string, dim: number): number[] {
    const vec = new Array(dim).fill(0);
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash << 5) - hash + word.charCodeAt(j);
        hash |= 0;
      }
      const index = Math.abs(hash) % dim;
      vec[index] += 1;
    }

    // Normalize vector
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vec;
    return vec.map((v) => v / norm);
  }
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const embeddingService = new EmbeddingService();

