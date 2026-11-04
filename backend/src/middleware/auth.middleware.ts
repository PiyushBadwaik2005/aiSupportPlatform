import { Response, NextFunction } from "express";
import { authService } from "../services/auth/auth.service";
import { AuthenticatedRequest } from "../types";
import { errorResponse } from "../utils/api-response";

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token = "";

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return errorResponse(res, "Authentication required. Please log in.", 401);
    }

    const payload = authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    return errorResponse(res, "Invalid or expired session. Please log in again.", 401);
  }
}

