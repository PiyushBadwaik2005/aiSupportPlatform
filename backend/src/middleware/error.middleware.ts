import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { errorResponse } from "../utils/api-response";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error("Unhandled error caught in middleware", {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });

  // Handle Multer upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return errorResponse(res, "File exceeds maximum allowed size.", 413);
    }
    return errorResponse(res, `Upload error: ${err.message}`, 400);
  }

  // Handle custom validation / operational error messages
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "An unexpected internal server error occurred."
      : err.message || "Internal server error";

  return errorResponse(res, message, statusCode);
}

