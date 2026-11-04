import { Response } from "express";
import path from "path";
import mongoose from "mongoose";
import { Document } from "../models/Document";
import { documentService } from "../services/documents/document.service";
import { AuthenticatedRequest } from "../types";
import { successResponse, errorResponse } from "../utils/api-response";
import { logger } from "../utils/logger";

export class DocumentController {
  async upload(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return errorResponse(res, "No file uploaded. Please upload a PDF, DOCX, or TXT file.", 400);
      }

      const businessId = req.user?.businessId;
      if (!businessId) {
        return errorResponse(res, "Unauthorized", 401);
      }

      const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "");
      const fileType = ext === "docx" ? "docx" : ext === "txt" ? "txt" : "pdf";
      const title = req.body.title?.trim() || req.file.originalname.replace(/\.[^/.]+$/, "");

      const doc = await Document.create({
        businessId: new mongoose.Types.ObjectId(businessId),
        title,
        originalFilename: req.file.originalname,
        fileType,
        fileSize: req.file.size,
        storagePath: req.file.path,
        status: "pending",
      });

      // Process document synchronously (or trigger background processing)
      try {
        await documentService.processDocument((doc._id as any).toString());
      } catch (procErr: any) {
        logger.warn("Document initial processing encountered error", {
          documentId: doc._id,
          error: procErr.message,
        });
      }

      const updated = await Document.findById(doc._id);
      return successResponse(res, updated, "Document uploaded and processing complete", 201);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const businessId = req.user?.businessId;
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
      const status = req.query.status as string;
      const search = req.query.search as string;

      const query: any = { businessId: new mongoose.Types.ObjectId(businessId) };
      if (status && ["pending", "processing", "ready", "failed"].includes(status)) {
        query.status = status;
      }
      if (search && search.trim()) {
        query.title = { $regex: search.trim(), $options: "i" };
      }

      const [docs, total] = await Promise.all([
        Document.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Document.countDocuments(query),
      ]);

      return successResponse(res, docs, "Documents retrieved", 200, {
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
      const doc = await Document.findOne({
        _id: new mongoose.Types.ObjectId(req.params.id),
        businessId: new mongoose.Types.ObjectId(req.user?.businessId),
      });

      if (!doc) {
        return errorResponse(res, "Document not found", 404);
      }

      return successResponse(res, doc);
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }

  async replace(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return errorResponse(res, "Replacement file is required.", 400);
      }

      const doc = await documentService.replaceDocument(
        req.params.id,
        req.user!.businessId,
        req.file
      );

      return successResponse(res, doc, "Document replaced and reprocessed successfully");
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  async retry(req: AuthenticatedRequest, res: Response) {
    try {
      const doc = await Document.findOne({
        _id: new mongoose.Types.ObjectId(req.params.id),
        businessId: new mongoose.Types.ObjectId(req.user?.businessId),
      });

      if (!doc) {
        return errorResponse(res, "Document not found", 404);
      }

      const updated = await documentService.processDocument((doc._id as any).toString());
      return successResponse(res, updated, "Document reprocessed successfully");
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      await documentService.deleteDocument(req.params.id, req.user!.businessId);
      return successResponse(res, null, "Document and indexed content deleted successfully");
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }
}

export const documentController = new DocumentController();

