import { Citation, RAGAnswerResult, SearchChunkResult } from "../../types";

export interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  isConfigured(): boolean;
  getDimensions(): number;
}

export interface RetrievalOptions {
  businessId: string;
  query: string;
  limit?: number;
  minScore?: number;
  mode?: "keyword" | "vector" | "hybrid";
}

export interface IRetrievalService {
  retrieve(options: RetrievalOptions): Promise<SearchChunkResult[]>;
}

export interface EvidenceEvaluation {
  isSufficient: boolean;
  confidence: number;
  reason: string;
  filteredChunks: SearchChunkResult[];
}

export interface IEvidenceService {
  evaluate(query: string, chunks: SearchChunkResult[], minScore: number): EvidenceEvaluation;
}

export interface AnswerGenerationOptions {
  query: string;
  chunks: SearchChunkResult[];
  businessName?: string;
  fallbackMessage?: string;
  systemGreeting?: string;
}

export interface IGeminiService {
  generateAnswer(options: AnswerGenerationOptions): Promise<RAGAnswerResult>;
  isConfigured(): boolean;
}

export interface IRagService {
  answerQuestion(
    businessId: string,
    question: string,
    conversationId?: string,
    source?: "playground" | "widget" | "api"
  ): Promise<RAGAnswerResult & { conversationId: string; unansweredQuestionId?: string }>;
}

