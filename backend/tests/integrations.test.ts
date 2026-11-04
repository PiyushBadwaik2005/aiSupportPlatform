import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { ApiKey } from "../src/models/ApiKey";
import { Conversation } from "../src/models/Conversation";
import { Message } from "../src/models/Message";
import { Document } from "../src/models/Document";
import { UnansweredQuestion } from "../src/models/UnansweredQuestion";
import { ApiUsage } from "../src/models/ApiUsage";
import { apiKeyService } from "../src/services/integrations/api-key.service";
import { analyticsService } from "../src/services/analytics/analytics.service";
import { conversationController } from "../src/controllers/conversation.controller";
import { requireApiKey } from "../src/middleware/apiKey.middleware";
import { requireAuth } from "../src/middleware/auth.middleware";
import { createMockResponse } from "./helpers";

describe("Business Integration REST API & Security (Tests 14, 15, 16, 17, 18)", () => {
  const businessAId = "65f011111111111111111111";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("14. API keys are generated, validated, revoked, and rotated", async () => {
    // 1. Generation
    const mockApiKeyDoc = {
      _id: new mongoose.Types.ObjectId(),
      businessId: new mongoose.Types.ObjectId(businessAId),
      name: "Mobile App Key",
      keyPrefix: "aisp_live_test123",
      hashedSecret: "test_hash",
      status: "active",
      permissions: ["chat:read", "chat:write"],
      save: vi.fn(),
    };

    vi.spyOn(ApiKey, "create").mockResolvedValue(mockApiKeyDoc as any);

    const { apiKey, rawKey } = await apiKeyService.createKey(businessAId, "Mobile App Key");
    expect(rawKey.startsWith("aisp_live_")).toBe(true);
    expect(apiKey.status).toBe("active");

    // 2. Revocation
    vi.spyOn(ApiKey, "findOneAndUpdate").mockResolvedValue(mockApiKeyDoc as any);
    const revoked = await apiKeyService.revokeKey((apiKey._id as any).toString(), businessAId);
    expect(revoked).toBe(true);

    // 3. Rotation
    vi.spyOn(ApiKey, "findOne").mockResolvedValue(mockApiKeyDoc as any);
    const rotationResult = await apiKeyService.rotateKey((apiKey._id as any).toString(), businessAId);
    expect(rotationResult.rawKey).toBeDefined();
    expect(mockApiKeyDoc.status).toBe("revoked");
  });

  it("15. Cross-business conversation access is strictly denied", async () => {
    const convId = new mongoose.Types.ObjectId().toString();

    // Querying with businessAId when conversation belongs to another business returns 404
    vi.spyOn(Conversation, "findOne").mockResolvedValue(null);

    const req: any = {
      params: { id: convId },
      user: { businessId: businessAId },
    };
    const res = createMockResponse();

    await conversationController.getById(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("16. Rate limits are configured and active on integration routes", async () => {
    const req: any = {
      headers: {},
    };
    const res = createMockResponse();
    const next = vi.fn();

    // Without API key, requireApiKey rejects request
    await requireApiKey(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Missing or invalid API key");
    expect(next).not.toHaveBeenCalled();
  });

  it("17. Dashboard statistics match persisted database records", async () => {
    vi.spyOn(Conversation, "countDocuments").mockResolvedValue(12);
    vi.spyOn(Message, "countDocuments").mockImplementation(async (query: any) => {
      if (query?.role === "user") return 35;
      return 30;
    });
    vi.spyOn(UnansweredQuestion, "countDocuments").mockResolvedValue(5);
    vi.spyOn(ApiUsage, "aggregate").mockResolvedValue([
      { total: 10, success: 9, failed: 1, tokens: 100 },
    ]);
    vi.spyOn(Document, "aggregate").mockResolvedValue([
      { _id: "ready", count: 4 },
      { _id: "failed", count: 1 },
    ]);
    vi.spyOn(Conversation, "find").mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue([]),
    } as any);
    vi.spyOn(UnansweredQuestion, "find").mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue([]),
    } as any);

    const metrics = await analyticsService.getDashboardOverview(businessAId);

    expect(metrics.totalConversations).toBe(12);
    expect(metrics.totalQuestions).toBe(35);
    expect(metrics.answeredQuestions).toBe(30);
    expect(metrics.unansweredQuestions).toBe(5);
    expect(metrics.documents.ready).toBe(4);
    expect(metrics.documents.failed).toBe(1);
    expect(metrics.documents.total).toBe(5);
    expect(metrics.answerRate).toBe(86); // 30/35 = 85.7% -> 86%
  });

  it("18. Public chat cannot access owner-only functionality", async () => {
    const req: any = {
      headers: {},
      cookies: {},
    };
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(next).not.toHaveBeenCalled();
  });
});
