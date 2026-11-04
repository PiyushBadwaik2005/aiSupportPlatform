import { Request } from "express";

export interface UserPayload {
  userId: string;
  businessId: string;
  email: string;
  role: "owner" | "admin" | "member";
}

export interface ApiKeyPayload {
  keyId: string;
  businessId: string;
  name: string;
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface ApiKeyRequest extends Request {
  apiKey?: ApiKeyPayload;
  businessId?: string;
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  snippet: string;
  page?: number;
  relevanceScore?: number;
}

export interface RAGAnswerResult {
  answer: string;
  answered: boolean;
  sources: Citation[];
  confidence: number;
  rawResponse?: string;
  tokenCount?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface SearchChunkResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  chunkIndex: number;
  page?: number;
  score: number;
  metadata?: Record<string, any>;
}

