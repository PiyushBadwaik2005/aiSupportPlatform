import { Request, Response } from "express";
import { Business } from "../models/Business";
import { ragService } from "../services/ai/rag.service";
import { AuthenticatedRequest } from "../types";
import { generatePublicChatToken, verifyPublicChatToken } from "../utils/crypto";
import { successResponse, errorResponse } from "../utils/api-response";

export class ChatController {
  /**
   * AI Playground chat for authenticated business owners
   */
  async playgroundChat(req: AuthenticatedRequest, res: Response) {
    try {
      const { question, conversationId } = req.body;
      const businessId = req.user!.businessId;

      const result = await ragService.answerQuestion(
        businessId,
        question,
        conversationId,
        "playground"
      );

      return successResponse(res, result);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * Public chat endpoint for customer website widget / demo
   * Uses public token or business slug without exposing privileged credentials
   */
  async publicChat(req: Request, res: Response) {
    try {
      const { question, conversationId, token, slug } = req.body;

      let businessId: string | undefined;

      if (token) {
        const verification = verifyPublicChatToken(token);
        if (verification.valid && verification.businessId) {
          businessId = verification.businessId;
        }
      }

      if (!businessId && slug) {
        const business = await Business.findOne({ slug: slug.toLowerCase() });
        if (business) {
          businessId = (business._id as any).toString();
        }
      }

      if (!businessId) {
        return errorResponse(res, "Invalid or missing business identifier or public token.", 401);
      }

      const result = await ragService.answerQuestion(
        businessId,
        question,
        conversationId,
        "widget"
      );

      return successResponse(res, result);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * Get public configuration & widget token for a business by its slug
   */
  async getPublicWidgetConfig(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const business = await Business.findOne({ slug: slug.toLowerCase() });

      if (!business) {
        return errorResponse(res, "Business not found.", 404);
      }

      const publicToken = generatePublicChatToken((business._id as any).toString());

      return successResponse(res, {
        businessId: business._id,
        businessName: business.name,
        slug: business.slug,
        greeting: business.settings?.defaultGreeting,
        publicToken,
      });
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
}

export const chatController = new ChatController();

