import { Response } from "express";
import mongoose from "mongoose";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { AuthenticatedRequest } from "../types";
import { successResponse, errorResponse } from "../utils/api-response";

export class ConversationController {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
      const source = req.query.source as string;

      const query: any = { businessId: new mongoose.Types.ObjectId(businessId) };
      if (source && ["playground", "widget", "api"].includes(source)) {
        query.source = source;
      }

      const [conversations, total] = await Promise.all([
        Conversation.find(query)
          .sort({ updatedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Conversation.countDocuments(query),
      ]);

      return successResponse(res, conversations, "Conversations retrieved", 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const convId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(convId)) {
        return errorResponse(res, "Invalid conversation ID", 400);
      }

      const conversation = await Conversation.findOne({
        _id: new mongoose.Types.ObjectId(convId),
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!conversation) {
        return errorResponse(res, "Conversation not found or access denied", 404);
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

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const convId = req.params.id;

      const conv = await Conversation.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(convId),
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!conv) {
        return errorResponse(res, "Conversation not found", 404);
      }

      // Delete associated messages
      await Message.deleteMany({ conversationId: conv._id });

      return successResponse(res, null, "Conversation deleted successfully");
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
}

export const conversationController = new ConversationController();

