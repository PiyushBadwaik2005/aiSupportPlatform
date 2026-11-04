import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  businessName: z.string().min(2, "Business name must be at least 2 characters").max(100),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const updateBusinessSettingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  website: z.string().url().optional().or(z.literal("")),
  settings: z
    .object({
      defaultGreeting: z.string().max(300).optional(),
      fallbackMessage: z.string().max(500).optional(),
      minRelevanceScore: z.number().min(0).max(1).optional(),
      ragRetrievalMode: z.enum(["keyword", "vector", "hybrid"]).optional(),
    })
    .optional(),
});

export const chatQuestionSchema = z.object({
  question: z.string().min(1, "Question cannot be empty").max(2000, "Question is too long"),
  conversationId: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  token: z.string().optional().nullable(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(2, "API key name must be at least 2 characters").max(60),
  permissions: z.array(z.string()).optional(),
});

export const resolveUnansweredQuestionSchema = z.object({
  notes: z.string().max(500).optional(),
  status: z.enum(["resolved", "ignored"]).default("resolved"),
});

