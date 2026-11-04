import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load .env file from backend root or workspace
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/ai_support_platform"),

  JWT_SECRET: z.string().default("dev-jwt-secret-key-change-in-production-min32chars!"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  AUTH_SESSION_SECRET: z.string().default("dev-session-secret-change-in-production!"),
  API_KEY_PEPPER: z.string().default("dev-api-key-pepper-change-in-production!"),

  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  GEMINI_EMBEDDING_MODEL: z.string().default("text-embedding-004"),

  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  UPLOAD_STORAGE_PATH: z.string().default("./uploads"),

  RAG_RETRIEVAL_MODE: z.enum(["keyword", "vector", "hybrid"]).default("keyword"),
  RAG_MIN_RELEVANCE_SCORE: z.coerce.number().default(0.35),
  RAG_CHUNK_SIZE: z.coerce.number().default(800),
  RAG_CHUNK_OVERLAP: z.coerce.number().default(120),
  RAG_MAX_RETRIEVED_CHUNKS: z.coerce.number().default(5),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 mins
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

