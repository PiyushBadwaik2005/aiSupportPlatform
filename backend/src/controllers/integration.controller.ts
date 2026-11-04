import { Response } from "express";
import mongoose from "mongoose";
import { ApiKey } from "../models/ApiKey";
import { ApiUsage } from "../models/ApiUsage";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { apiKeyService } from "../services/integrations/api-key.service";
import { ragService } from "../services/ai/rag.service";
import { AuthenticatedRequest, ApiKeyRequest } from "../types";
import { successResponse, errorResponse } from "../utils/api-response";

export class IntegrationController {
  // ==========================================
  // Privileged Owner Endpoints (requireAuth)
  // ==========================================

  async createKey(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, permissions } = req.body;
      const businessId = req.user!.businessId;
      const userId = req.user!.userId;

      const result = await apiKeyService.createKey(businessId, name, userId, permissions);

      return successResponse(
        res,
        {
          apiKey: result.apiKey,
          secretKey: result.rawKey, // ONLY RETURNED ONCE!
        },
        "API Key created successfully. Store the secretKey safely; it cannot be shown again.",
        201
      );
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  async listKeys(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const keys = await ApiKey.find({
        businessId: new mongoose.Types.ObjectId(businessId),
      }).sort({ createdAt: -1 });

      return successResponse(res, keys, "API keys retrieved");
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  async revokeKey(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const businessId = req.user!.businessId;

      const success = await apiKeyService.revokeKey(id, businessId);
      if (!success) {
        return errorResponse(res, "API Key not found or already revoked.", 404);
      }

      return successResponse(res, null, "API Key revoked successfully.");
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  async rotateKey(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const businessId = req.user!.businessId;
      const userId = req.user!.userId;

      const result = await apiKeyService.rotateKey(id, businessId, userId);

      return successResponse(
        res,
        {
          apiKey: result.apiKey,
          secretKey: result.rawKey,
        },
        "API Key rotated successfully. The previous key has been revoked. Store the new secretKey safely.",
        200
      );
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  async getUsage(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = new mongoose.Types.ObjectId(req.user!.businessId);
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

      const [logs, total, stats] = await Promise.all([
        ApiUsage.find({ businessId })
          .sort({ timestamp: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("apiKeyId", "name keyPrefix"),
        ApiUsage.countDocuments({ businessId }),
        ApiUsage.aggregate([
          { $match: { businessId } },
          {
            $group: {
              _id: null,
              totalCalls: { $sum: 1 },
              successCalls: { $sum: { $cond: ["$isSuccess", 1, 0] } },
              failedCalls: { $sum: { $cond: ["$isSuccess", 0, 1] } },
              avgResponseTime: { $avg: "$responseTimeMs" },
              totalTokens: { $sum: "$tokensUsed" },
            },
          },
        ]),
      ]);

      const summary = stats[0] || {
        totalCalls: 0,
        successCalls: 0,
        failedCalls: 0,
        avgResponseTime: 0,
        totalTokens: 0,
      };

      return successResponse(
        res,
        {
          summary: {
            ...summary,
            avgResponseTime: Math.round(summary.avgResponseTime || 0),
          },
          logs,
        },
        "API usage retrieved",
        200,
        {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      );
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  // ==========================================
  // External Integration Endpoints (requireApiKey)
  // ==========================================

  async integrationChat(req: ApiKeyRequest, res: Response) {
    try {
      const businessId = req.businessId!;
      const { question, conversationId } = req.body;

      if (!question || typeof question !== "string") {
        return errorResponse(res, "Field 'question' is required.", 400);
      }

      const result = await ragService.answerQuestion(businessId, question, conversationId, "api");

      return successResponse(res, {
        answer: result.answer,
        answered: result.answered,
        sources: result.sources,
        confidence: result.confidence,
        conversationId: result.conversationId,
      });
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  async integrationCreateConversation(req: ApiKeyRequest, res: Response) {
    try {
      const businessId = req.businessId!;
      const { title, metadata } = req.body;

      const conversation = await Conversation.create({
        businessId: new mongoose.Types.ObjectId(businessId),
        sessionId: `api_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        source: "api",
        title: title || "API Conversation",
        metadata,
      });

      return successResponse(res, conversation, "Conversation created", 201);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  async integrationGetConversation(req: ApiKeyRequest, res: Response) {
    try {
      const businessId = req.businessId!;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, "Invalid conversation ID", 400);
      }

      const conversation = await Conversation.findOne({
        _id: new mongoose.Types.ObjectId(id),
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!conversation) {
        return errorResponse(res, "Conversation not found", 404);
      }

      const messages = await Message.find({
        conversationId: conversation._id,
        businessId: new mongoose.Types.ObjectId(businessId),
      }).sort({ createdAt: 1 });

      return successResponse(res, { conversation, messages });
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
}

export const integrationController = new IntegrationController();

