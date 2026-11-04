import { Response } from "express";
import { analyticsService } from "../services/analytics/analytics.service";
import { AuthenticatedRequest } from "../types";
import { successResponse, errorResponse } from "../utils/api-response";

export class AnalyticsController {
  async getOverview(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const data = await analyticsService.getDashboardOverview(businessId);
      return successResponse(res, data, "Dashboard metrics retrieved");
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
}

export const analyticsController = new AnalyticsController();

