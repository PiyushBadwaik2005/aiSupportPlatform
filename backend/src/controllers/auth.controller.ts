import { Request, Response } from "express";
import { authService } from "../services/auth/auth.service";
import { User } from "../models/User";
import { Business } from "../models/Business";
import { AuthenticatedRequest } from "../types";
import { successResponse, errorResponse } from "../utils/api-response";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);

      // Set HTTP-only cookie
      const isProd = process.env.NODE_ENV === "production";
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return successResponse(
        res,
        {
          user: result.user,
          business: result.business,
          token: result.token,
        },
        "Registration successful",
        201
      );
    } catch (err: any) {
      return errorResponse(res, err.message, 400);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      const isProd = process.env.NODE_ENV === "production";
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return successResponse(
        res,
        {
          user: result.user,
          business: result.business,
          token: result.token,
        },
        "Login successful"
      );
    } catch (err: any) {
      return errorResponse(res, err.message, 401);
    }
  }

  async logout(_req: Request, res: Response) {
    res.clearCookie("token");
    return successResponse(res, null, "Successfully logged out");
  }

  async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return errorResponse(res, "Unauthorized", 401);
      }

      const user = await User.findById(req.user.userId);
      const business = await Business.findById(req.user.businessId);

      if (!user || !business) {
        return errorResponse(res, "User or business not found", 404);
      }

      return successResponse(res, { user, business });
    } catch (err: any) {
      return errorResponse(res, err.message, 500);
    }
  }
}

export const authController = new AuthController();

