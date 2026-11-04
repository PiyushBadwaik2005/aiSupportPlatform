import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { env } from "../../config/env";
import { ExtractedDocument } from "./document-loader.service";

export interface ChunkOutput {
  chunkIndex: number;
  content: string;
  page?: number;
  metadata: {
    documentTitle: string;
    originalFilename: string;
    fileType: string;
    chunkLength: number;
    [key: string]: any;
  };
}

export class ChunkingService {
  private splitter: RecursiveCharacterTextSplitter;

  constructor(chunkSize = env.RAG_CHUNK_SIZE, chunkOverlap = env.RAG_CHUNK_OVERLAP) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ["\n\n", "\n", ". ", "? ", "! ", " ", ""],
    });
  }

  /**
   * Split an extracted document into structured LangChain chunks with metadata
   */
  async chunkDocument(
    extracted: ExtractedDocument,
    metadata: {
      documentTitle: string;
      originalFilename: string;
      fileType: string;
    }
  ): Promise<ChunkOutput[]> {
    const chunks: ChunkOutput[] = [];
    let globalIndex = 0;

    for (const pageItem of extracted.pages) {
      if (!pageItem.text || pageItem.text.trim().length === 0) continue;

      const pageChunks = await this.splitter.splitText(pageItem.text);

      for (const textChunk of pageChunks) {
        const trimmed = textChunk.trim();
        if (trimmed.length < 15) continue; // Skip trivial fragments

        chunks.push({
          chunkIndex: globalIndex++,
          content: trimmed,
          page: pageItem.page,
          metadata: {
            ...metadata,
            chunkLength: trimmed.length,
          },
        });
      }
    }

    // Fallback if pages yielded nothing but totalText is present
    if (chunks.length === 0 && extracted.totalText.trim().length > 0) {
      const allChunks = await this.splitter.splitText(extracted.totalText);
      for (const textChunk of allChunks) {
        const trimmed = textChunk.trim();
        if (trimmed.length < 15) continue;

        chunks.push({
          chunkIndex: globalIndex++,
          content: trimmed,
          metadata: {
            ...metadata,
            chunkLength: trimmed.length,
          },
        });
      }
    }

    return chunks;
  }
}

export const chunkingService = new ChunkingService();

