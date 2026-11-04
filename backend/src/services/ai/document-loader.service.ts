import fs from "fs/promises";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { logger } from "../../utils/logger";

export interface ExtractedPage {
  text: string;
  page?: number;
}

export interface ExtractedDocument {
  pages: ExtractedPage[];
  totalText: string;
  wordCount: number;
  metadata?: Record<string, any>;
}

export class DocumentLoaderService {
  /**
   * Load and extract text from a file on disk or buffer
   */
  async loadFromFile(filePath: string, fileType: "pdf" | "docx" | "txt"): Promise<ExtractedDocument> {
    const buffer = await fs.readFile(filePath);
    return this.loadFromBuffer(buffer, fileType);
  }

  /**
   * Load and extract text from a memory buffer
   */
  async loadFromBuffer(buffer: Buffer, fileType: "pdf" | "docx" | "txt"): Promise<ExtractedDocument> {
    switch (fileType) {
      case "pdf":
        return this.loadPdf(buffer);
      case "docx":
        return this.loadDocx(buffer);
      case "txt":
        return this.loadTxt(buffer);
      default:
        throw new Error(`Unsupported document type: ${fileType}`);
    }
  }

  private async loadPdf(buffer: Buffer): Promise<ExtractedDocument> {
    try {
      const data = await pdfParse(buffer);
      const normalized = this.normalizeText(data.text);

      if (!normalized || normalized.trim().length === 0) {
        throw new Error("PDF contains no extractable or readable text.");
      }

      // Estimate pages or use data.numpages
      const numPages = data.numpages || 1;
      const pages: ExtractedPage[] = [];

      // pdf-parse provides full text with form feeds (\f) separating pages
      const rawPages = data.text.split("\f");
      if (rawPages.length > 1) {
        rawPages.forEach((p, idx) => {
          const clean = this.normalizeText(p);
          if (clean.length > 0) {
            pages.push({ text: clean, page: idx + 1 });
          }
        });
      } else {
        pages.push({ text: normalized, page: 1 });
      }

      return {
        pages,
        totalText: normalized,
        wordCount: this.countWords(normalized),
        metadata: {
          numPages,
          info: data.info,
        },
      };
    } catch (err: any) {
      logger.error("Failed to parse PDF document", { error: err.message });
      throw new Error(`Failed to parse PDF: ${err.message}`);
    }
  }

  private async loadDocx(buffer: Buffer): Promise<ExtractedDocument> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const normalized = this.normalizeText(result.value);

      if (!normalized || normalized.trim().length === 0) {
        throw new Error("DOCX document contains no readable text.");
      }

      return {
        pages: [{ text: normalized, page: 1 }],
        totalText: normalized,
        wordCount: this.countWords(normalized),
      };
    } catch (err: any) {
      logger.error("Failed to parse DOCX document", { error: err.message });
      throw new Error(`Failed to parse DOCX: ${err.message}`);
    }
  }

  private async loadTxt(buffer: Buffer): Promise<ExtractedDocument> {
    try {
      const text = buffer.toString("utf-8");
      const normalized = this.normalizeText(text);

      if (!normalized || normalized.trim().length === 0) {
        throw new Error("TXT document is empty or unreadable.");
      }

      return {
        pages: [{ text: normalized, page: 1 }],
        totalText: normalized,
        wordCount: this.countWords(normalized),
      };
    } catch (err: any) {
      logger.error("Failed to parse TXT document", { error: err.message });
      throw new Error(`Failed to parse TXT: ${err.message}`);
    }
  }

  private normalizeText(text: string): string {
    if (!text) return "";
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\0/g, "") // remove null bytes
      .replace(/[ \t]+/g, " ") // collapse multiple inline spaces
      .replace(/\n{3,}/g, "\n\n") // collapse excessive line breaks
      .trim();
  }

  private countWords(text: string): number {
    if (!text) return 0;
    const matches = text.trim().match(/\S+/g);
    return matches ? matches.length : 0;
  }
}

export const documentLoaderService = new DocumentLoaderService();

