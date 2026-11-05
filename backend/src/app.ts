import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { env } from "./config/env";
import { errorResponse } from "./utils/api-response";

export function createApp(): Application {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS Configuration
  const allowedOrigins = [
    env.FRONTEND_URL.replace(/\/$/, ""),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Allow mobile apps, cURL, Postman with no origin header
        if (!requestOrigin) return callback(null, true);
        const cleanOrigin = requestOrigin.replace(/\/$/, "");
        if (
          allowedOrigins.includes(cleanOrigin) ||
          cleanOrigin.endsWith(".onrender.com") ||
          cleanOrigin.endsWith(".vercel.app") ||
          process.env.NODE_ENV !== "production"
        ) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    })
  );

  // Parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  // Mount API Routes
  app.use("/api", routes);

  // 404 Handler
  app.use((_req: Request, res: Response) => {
    return errorResponse(res, "Endpoint not found", 404);
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();

