import mongoose from "mongoose";
import { Business } from "../../models/Business";
import { Conversation } from "../../models/Conversation";
import { Message } from "../../models/Message";
import { UnansweredQuestion } from "../../models/UnansweredQuestion";
import { RAGAnswerResult } from "../../types";
import { logger } from "../../utils/logger";
import { evidenceService } from "./evidence.service";
import { geminiService } from "./gemini.service";
import { IRagService } from "./interfaces";
import { retrievalService } from "./retrieval.service";

export class RagService implements IRagService {
  /**
   * Main RAG question answering pipeline
   */
  async answerQuestion(
    businessId: string,
    question: string,
    conversationId?: string,
    source: "playground" | "widget" | "api" = "playground"
  ): Promise<RAGAnswerResult & { conversationId: string; unansweredQuestionId?: string }> {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      throw new Error("Question cannot be empty");
    }

    // 1. Fetch business and settings
    const business = await Business.findById(businessId);
    if (!business) {
      throw new Error(`Business not found with ID ${businessId}`);
    }

    const fallbackMessage =
      business.settings?.fallbackMessage ||
      "I couldn't find this information in the business's available documents. Please contact the business for confirmation.";
    const minScore = business.settings?.minRelevanceScore ?? 0.35;
    const mode = business.settings?.ragRetrievalMode || "keyword";

    // 2. Resolve or create conversation
    let conv;
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conv = await Conversation.findOne({
        _id: new mongoose.Types.ObjectId(conversationId),
        businessId: new mongoose.Types.ObjectId(businessId),
      });
    }

    if (!conv) {
      conv = await Conversation.create({
        businessId: new mongoose.Types.ObjectId(businessId),
        sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        source,
        title: trimmedQuestion.slice(0, 50),
        messageCount: 0,
      });
    }

    // 3. Save User message to conversation
    await Message.create({
      conversationId: conv._id,
      businessId: new mongoose.Types.ObjectId(businessId),
      role: "user",
      content: trimmedQuestion,
      isAnswered: true,
      citations: [],
    });

    // 4. Retrieve candidate chunks strictly isolated to this business's ready documents
    const retrievedChunks = await retrievalService.retrieve({
      businessId,
      query: trimmedQuestion,
      minScore: 0.1, // fetch with loose cutoff for evidence evaluation
      mode,
    });

    // 5. Evaluate evidence sufficiency
    const evaluation = evidenceService.evaluate(trimmedQuestion, retrievedChunks, minScore);

    let answerResult: RAGAnswerResult;
    let unansweredQuestionDocId: string | undefined;

    if (!evaluation.isSufficient) {
      logger.info("Evidence insufficient; returning controlled fallback", {
        businessId,
        reason: evaluation.reason,
      });

      answerResult = {
        answer: fallbackMessage,
        answered: false,
        sources: [],
        confidence: evaluation.confidence,
      };

      // Record question into UnansweredQuestion collection
      const unanswered = await UnansweredQuestion.create({
        businessId: new mongoose.Types.ObjectId(businessId),
        question: trimmedQuestion,
        conversationId: conv._id,
        status: "open",
        relevanceScore: evaluation.confidence,
        reason: evaluation.reason,
      });
      unansweredQuestionDocId = (unanswered._id as any).toString();
    } else {
      // 6. Generate answer using Gemini & LangChain
      try {
        answerResult = await geminiService.generateAnswer({
          query: trimmedQuestion,
          chunks: evaluation.filteredChunks,
          businessName: business.name,
          fallbackMessage,
        });

        // If LLM returned fallback despite evidence, record as unanswered
        if (!answerResult.answered) {
          const unanswered = await UnansweredQuestion.create({
            businessId: new mongoose.Types.ObjectId(businessId),
            question: trimmedQuestion,
            conversationId: conv._id,
            status: "open",
            relevanceScore: answerResult.confidence,
            reason: "LLM determined evidence was insufficient to form a factual answer",
          });
          unansweredQuestionDocId = (unanswered._id as any).toString();
        }
      } catch (err: any) {
        logger.error("Gemini answer generation failed", { error: err.message });
        throw err;
      }
    }

    // 7. Save Assistant message to conversation
    await Message.create({
      conversationId: conv._id,
      businessId: new mongoose.Types.ObjectId(businessId),
      role: "assistant",
      content: answerResult.answer,
      isAnswered: answerResult.answered,
      citations: answerResult.sources,
      confidence: answerResult.confidence,
    });

    // 8. Update conversation message count
    await Conversation.findByIdAndUpdate(conv._id, {
      $inc: { messageCount: 2 },
      updatedAt: new Date(),
    });

    return {
      ...answerResult,
      conversationId: (conv._id as any).toString(),
      unansweredQuestionId: unansweredQuestionDocId,
    };
  }
}

export const ragService = new RagService();

