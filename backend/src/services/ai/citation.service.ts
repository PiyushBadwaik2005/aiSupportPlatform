import { Citation, SearchChunkResult } from "../../types";

export class CitationService {
  /**
   * Format search chunks into clean, verified source citations
   */
  generateCitations(chunks: SearchChunkResult[]): Citation[] {
    if (!chunks || chunks.length === 0) return [];

    const seen = new Set<string>();
    const citations: Citation[] = [];

    for (const chunk of chunks) {
      const key = `${chunk.documentId}-${chunk.chunkIndex}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Extract a clean snippet of around 160 characters
      const cleanSnippet = this.extractSnippet(chunk.content);

      citations.push({
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        chunkIndex: chunk.chunkIndex,
        snippet: cleanSnippet,
        page: chunk.page,
        relevanceScore: chunk.score,
      });
    }

    return citations;
  }

  private extractSnippet(content: string, maxLength = 180): string {
    const trimmed = content.replace(/\s+/g, " ").trim();
    if (trimmed.length <= maxLength) return trimmed;
    return trimmed.slice(0, maxLength) + "...";
  }
}

export const citationService = new CitationService();

