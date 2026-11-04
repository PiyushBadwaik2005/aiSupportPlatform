import mongoose from "mongoose";
import { Conversation } from "../../models/Conversation";
import { Message } from "../../models/Message";
import { UnansweredQuestion } from "../../models/UnansweredQuestion";
import { Document } from "../../models/Document";
import { ApiUsage } from "../../models/ApiUsage";

export interface DashboardOverviewMetrics {
  totalConversations: number;
  totalQuestions: number;
  answeredQuestions: number;
  unansweredQuestions: number;
  answerRate: number;
  documents: {
    total: number;
    ready: number;
    processing: number;
    failed: number;
  };
  apiUsage: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalTokens: number;
  };
  recentConversations: any[];
  recentUnanswered: any[];
  chartData: {
    date: string;
    answered: number;
    unanswered: number;
  }[];
}

export class AnalyticsService {
  async getDashboardOverview(businessId: string): Promise<DashboardOverviewMetrics> {
    const bId = new mongoose.Types.ObjectId(businessId);

    // Parallel metric queries
    const [
      totalConversations,
      totalQuestions,
      answeredQuestions,
      unansweredQuestions,
      documents,
      apiStats,
      recentConversations,
      recentUnanswered,
    ] = await Promise.all([
      Conversation.countDocuments({ businessId: bId }),
      Message.countDocuments({ businessId: bId, role: "user" }),
      Message.countDocuments({ businessId: bId, role: "assistant", isAnswered: true }),
      UnansweredQuestion.countDocuments({ businessId: bId, status: "open" }),
      Document.aggregate([
        { $match: { businessId: bId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      ApiUsage.aggregate([
        { $match: { businessId: bId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            success: { $sum: { $cond: ["$isSuccess", 1, 0] } },
            failed: { $sum: { $cond: ["$isSuccess", 0, 1] } },
            tokens: { $sum: "$tokensUsed" },
          },
        },
      ]),
      Conversation.find({ businessId: bId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("_id title source messageCount createdAt updatedAt"),
      UnansweredQuestion.find({ businessId: bId, status: "open" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("_id question relevanceScore createdAt reason"),
    ]);

    // Format document counts
    const docCounts = { total: 0, ready: 0, processing: 0, failed: 0 };
    for (const d of documents) {
      if (d._id === "ready") docCounts.ready = d.count;
      else if (d._id === "processing") docCounts.processing = d.count;
      else if (d._id === "failed") docCounts.failed = d.count;
      docCounts.total += d.count;
    }

    // Format API counts
    const apiUsage = {
      totalRequests: apiStats[0]?.total || 0,
      successfulRequests: apiStats[0]?.success || 0,
      failedRequests: apiStats[0]?.failed || 0,
      totalTokens: apiStats[0]?.tokens || 0,
    };

    const answerRate =
      totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 100;

    // Generate recent 7-day chart buckets
    const chartData = await this.getWeeklyTrends(bId);

    return {
      totalConversations,
      totalQuestions,
      answeredQuestions,
      unansweredQuestions,
      answerRate,
      documents: docCounts,
      apiUsage,
      recentConversations,
      recentUnanswered,
      chartData,
    };
  }

  private async getWeeklyTrends(businessId: mongoose.Types.ObjectId) {
    const days: { date: string; answered: number; unanswered: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const [answered, unanswered] = await Promise.all([
        Message.countDocuments({
          businessId,
          role: "assistant",
          isAnswered: true,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        }),
        UnansweredQuestion.countDocuments({
          businessId,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        }),
      ]);

      days.push({
        date: dateStr.slice(5), // "MM-DD"
        answered,
        unanswered,
      });
    }

    return days;
  }
}

export const analyticsService = new AnalyticsService();

