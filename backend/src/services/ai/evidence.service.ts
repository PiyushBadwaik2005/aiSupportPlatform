import { SearchChunkResult } from "../../types";
import { EvidenceEvaluation, IEvidenceService } from "./interfaces";

export class EvidenceService implements IEvidenceService {
  /**
   * Evaluate whether retrieved chunks provide sufficient, reliable evidence to answer the query
   */
  evaluate(query: string, chunks: SearchChunkResult[], minScore: number): EvidenceEvaluation {
    if (!chunks || chunks.length === 0) {
      return {
        isSufficient: false,
        confidence: 0,
        reason: "No matching documents found in knowledge base.",
        filteredChunks: [],
      };
    }

    // Filter chunks strictly meeting the minimum score threshold
    const filteredChunks = chunks.filter((c) => c.score >= minScore);

    if (filteredChunks.length === 0) {
      return {
        isSufficient: false,
        confidence: chunks[0]?.score || 0,
        reason: `Retrieved chunks scored below the required threshold of ${minScore}.`,
        filteredChunks: [],
      };
    }

    // Check for essential query keywords overlap
    const stopWords = new Set([
      "what", "where", "when", "which", "how", "why", "who", "does", "have", "can",
      "your", "the", "and", "for", "with", "about", "are", "you", "tell", "please",
      "give", "info", "information"
    ]);

    const queryKeywords = query
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    // If query has specific subject keywords, ensure at least some match in top evidence
    if (queryKeywords.length > 0) {
      const topEvidence = filteredChunks
        .slice(0, 4)
        .map((c) => `${c.documentTitle || ""} ${c.content}`.toLowerCase())
        .join(" ");
      const matchedKeywords = queryKeywords.filter((kw) => topEvidence.includes(kw));

      // If less than 25% of distinctive query keywords appear anywhere in top evidence, reject as insufficient
      const keywordRatio = matchedKeywords.length / queryKeywords.length;
      if (keywordRatio < 0.25) {
        return {
          isSufficient: false,
          confidence: Math.round(keywordRatio * 100) / 100,
          reason: "Top evidence lacks sufficient keyword correlation with question topics.",
          filteredChunks,
        };
      }
    }

    const topScore = filteredChunks[0].score;
    const avgScore =
      filteredChunks.reduce((acc, c) => acc + c.score, 0) / filteredChunks.length;
    const confidence = Math.round(((topScore * 0.7) + (avgScore * 0.3)) * 100) / 100;

    return {
      isSufficient: true,
      confidence,
      reason: "Sufficient supporting evidence identified in knowledge base.",
      filteredChunks,
    };
  }
}

export const evidenceService = new EvidenceService();
