import { Response } from "express";
import mongoose from "mongoose";
import { UnansweredQuestion } from "../models/UnansweredQuestion";
import { AuthenticatedRequest } from "../types";
import { successResponse, errorResponse } from "../utils/api-response";

export class UnansweredQuestionController {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
      const status = req.query.status as string;
      const search = req.query.search as string;

      const query: any = { businessId: new mongoose.Types.ObjectId(businessId) };
      if (status && ["open", "resolved", "ignored"].includes(status)) {
        query.status = status;
      }
      if (search && search.trim()) {
        query.question = { $regex: search.trim(), $options: "i" };
      }

      const [questions, total] = await Promise.all([
        UnansweredQuestion.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("conversationId", "title source"),
        UnansweredQuestion.countDocuments(query),
      ]);

      return successResponse(res, questions, "Unanswered questions retrieved", 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  async resolve(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      const { status = "resolved", notes } = req.body;

      const question = await UnansweredQuestion.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(id),
          businessId: new mongoose.Types.ObjectId(businessId),
        },
        {
          status,
          notes,
          resolvedAt: new Date(),
          resolvedBy: new mongoose.Types.ObjectId(req.user!.userId),
        },
        { new: true }
      );

      if (!question) {
        return errorResponse(res, "Question not found", 404);
      }

      return successResponse(res, question, "Question marked as resolved");
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
}

export const unansweredQuestionController = new UnansweredQuestionController();

