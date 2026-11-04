import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { RAGAnswerResult } from "../../types";
import { AnswerGenerationOptions, IGeminiService } from "./interfaces";
import { citationService } from "./citation.service";

export class GeminiService implements IGeminiService {
  private model: ChatGoogleGenerativeAI | null = null;

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
      try {
        this.model = new ChatGoogleGenerativeAI({
          apiKey: env.GEMINI_API_KEY,
          model: env.GEMINI_MODEL || "gemini-flash-latest",
          temperature: 0.1, // low temperature for high grounding and factual accuracy
          maxOutputTokens: 1024,
        });
      } catch (err: any) {
        logger.warn("Failed to initialize ChatGoogleGenerativeAI", { error: err.message });
        this.model = null;
      }
    }
  }

  isConfigured(): boolean {
    return this.model !== null && Boolean(env.GEMINI_API_KEY);
  }

  /**
   * Generate an answer using LangChain and Gemini with strict evidence isolation
   */
  async generateAnswer(options: AnswerGenerationOptions): Promise<RAGAnswerResult> {
    const {
      query,
      chunks,
      businessName = "the business",
      fallbackMessage = "I couldn't find this information in the business's available documents. Please contact the business for confirmation.",
    } = options;

    if (!chunks || chunks.length === 0) {
      return {
        answer: fallbackMessage,
        answered: false,
        sources: [],
        confidence: 0,
      };
    }

    // Format citations
    const sources = citationService.generateCitations(chunks);

    // If Gemini is not configured with an API key, synthesize grounded response from top chunks directly
    if (!this.isConfigured() || !this.model) {
      logger.info("Gemini API key not configured; generating direct evidence synthesis.");
      const topEvidence = chunks.slice(0, 2).map((c) => c.content).join("\n\n");
      return {
        answer: `Based on ${businessName}'s documentation:\n\n${topEvidence}`,
        answered: true,
        sources,
        confidence: chunks[0]?.score || 0.8,
      };
    }

    // Build untrusted evidence block
    const formattedExcerpts = chunks
      .map((c, i) => `[Source ${i + 1} - "${c.documentTitle}" (Page ${c.page || "N/A"})]:\n${c.content}`)
      .join("\n\n---\n\n");

    const promptTemplate = PromptTemplate.fromTemplate(`
You are a factual, professional customer support AI assistant for {businessName}.
The business documents provided below contain verified knowledge about {businessName}, its products, services, policies, and affiliated brands or entities.

CRITICAL INSTRUCTIONS:
1. Fact-Based Grounding: Answer the customer's question or topic inquiry using ONLY the facts and details provided in the DOCUMENT EXCERPTS below. Do NOT invent dates, numbers, prices, procedures, or policies.
2. Topical & Keyword Inquiries: Customers frequently ask short or topical questions (e.g., "policy", "refund policy", "pricing", "support hours"). When answering these, synthesize and summarize all relevant policies, timelines, conditions, and details found in the excerpts.
3. Brand / Entity Names: The documentation may refer to company names, product lines, or entities (e.g., TechNova, NovaDesk). Treat all information in the excerpts as official knowledge for {businessName}.
4. Unanswered Questions: ONLY if the provided excerpts contain NO relevant information whatsoever to address the question, respond EXACTLY with the fallback message:
"{fallbackMessage}"
Do not append any extra commentary or apologies if using the fallback message.
5. Tone & Style: Be polite, concise, structured (using bullet points where appropriate), and direct. Never say you are an AI model; respond as the customer support representative for {businessName}.

DOCUMENT EXCERPTS:
{context}

CUSTOMER QUESTION:
{question}

HELPFUL GROUNDED ANSWER:
`);

    try {
      // Bounded call with 15-second timeout
      const formattedPrompt = await promptTemplate.format({
        businessName,
        fallbackMessage,
        context: formattedExcerpts,
        question: query,
      });

      const response = await Promise.race([
        this.model.invoke(formattedPrompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini API call timed out after 15 seconds")), 15000)
        ),
      ]);

      const answerText = typeof response.content === "string" ? response.content.trim() : "";

      // Check if response matches or implies fallback
      const normalizedAnswer = answerText.toLowerCase().trim();
      const normalizedFallback = fallbackMessage.toLowerCase().trim();

      const isFallback =
        normalizedAnswer === normalizedFallback ||
        normalizedAnswer.includes(normalizedFallback) ||
        normalizedAnswer.startsWith("i couldn't find this information") ||
        normalizedAnswer.startsWith("i could not find this information") ||
        normalizedAnswer.length < 5;

      return {
        answer: isFallback ? fallbackMessage : answerText,
        answered: !isFallback,
        sources: isFallback ? [] : sources,
        confidence: isFallback ? 0.2 : chunks[0]?.score || 0.85,
        rawResponse: answerText,
      };
    } catch (err: any) {
      logger.error("Gemini invocation failed", { error: err.message });
      // Distinguish API infrastructure errors
      throw new Error(`AI service error: ${err.message}`);
    }
  }
}

export const geminiService = new GeminiService();
