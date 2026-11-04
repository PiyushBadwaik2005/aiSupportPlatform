import { Response } from "express";
import { Business } from "../models/Business";
import { AuthenticatedRequest } from "../types";
import { successResponse, errorResponse } from "../utils/api-response";

export class BusinessController {
  async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const business = await Business.findById(req.user!.businessId);
      if (!business) {
        return errorResponse(res, "Business not found", 404);
      }
      return successResponse(res, business);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, website, settings } = req.body;
      const updateData: any = {};

      if (name) updateData.name = name;
      if (website !== undefined) updateData.website = website;
      if (settings) {
        updateData.settings = settings;
      }

      const business = await Business.findByIdAndUpdate(
        req.user!.businessId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!business) {
        return errorResponse(res, "Business not found", 404);
      }

      return successResponse(res, business, "Settings updated successfully");
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }
}

export const businessController = new BusinessController();

