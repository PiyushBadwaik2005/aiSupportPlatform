import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function successResponse<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200,
  pagination?: ApiResponse["pagination"]
) {
  const payload: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
    ...(pagination && { pagination }),
  };
  return res.status(statusCode).json(payload);
}

export function errorResponse(
  res: Response,
  error: string,
  statusCode = 400,
  details?: any
) {
  const payload: ApiResponse = {
    success: false,
    error,
    ...(details && { data: details }),
  };
  return res.status(statusCode).json(payload);
}

