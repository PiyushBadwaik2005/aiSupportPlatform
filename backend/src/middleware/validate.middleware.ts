import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { errorResponse } from "../utils/api-response";

export function validateBody(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        return errorResponse(res, `Validation error: ${issues}`, 400);
      }
      return errorResponse(res, "Invalid request payload.", 400);
    }
  };
}

export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        return errorResponse(res, `Query validation error: ${issues}`, 400);
      }
      return errorResponse(res, "Invalid query parameters.", 400);
    }
  };
}

