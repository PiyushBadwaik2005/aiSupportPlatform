import { Response, NextFunction } from "express";
import { apiKeyService } from "../services/integrations/api-key.service";
import { ApiKeyRequest } from "../types";
import { errorResponse } from "../utils/api-response";

export async function requireApiKey(req: ApiKeyRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();

  let rawKey = "";
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer aisp_live_")) {
    rawKey = authHeader.substring(7).trim();
  } else if (typeof req.headers["x-api-key"] === "string") {
    rawKey = req.headers["x-api-key"].trim();
  }

  if (!rawKey) {
    return errorResponse(res, "Missing or invalid API key. Provide Bearer aisp_live_... token.", 401);
  }

  try {
    const key = await apiKeyService.validateKey(rawKey);
    if (!key) {
      return errorResponse(res, "Invalid or revoked API key.", 401);
    }

    req.apiKey = {
      keyId: (key._id as any).toString(),
      businessId: (key.businessId as any).toString(),
      name: key.name,
      permissions: key.permissions,
    };
    req.businessId = (key.businessId as any).toString();

    // Hook into response finish to record API usage analytics
    res.on("finish", () => {
      const responseTimeMs = Date.now() - startTime;
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

      apiKeyService.recordUsage({
        businessId: req.businessId!,
        apiKeyId: req.apiKey?.keyId,
        endpoint: req.originalUrl || req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTimeMs,
        isSuccess,
      });
    });

    next();
  } catch (err: any) {
    return errorResponse(res, "Error authenticating API key.", 500);
  }
}

