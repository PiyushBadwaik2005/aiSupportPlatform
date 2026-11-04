import { describe, it, expect, vi, beforeEach } from "vitest";
import { authController } from "../src/controllers/auth.controller";
import { requireAuth } from "../src/middleware/auth.middleware";
import { User } from "../src/models/User";
import { Business } from "../src/models/Business";
import * as cryptoUtils from "../src/utils/crypto";
import { createMockResponse } from "./helpers";

describe("Authentication & Business Isolation (Tests 1, 2, 3)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Business owner registration and login successfully works", async () => {
    const mockBusiness = {
      _id: "65f011111111111111111111",
      name: "Acme Corp",
      slug: "acme-corp",
      save: vi.fn(),
    };

    const mockUser = {
      _id: "65f022222222222222222222",
      name: "Alice Owner",
      email: "alice@acme.com",
      passwordHash: "hashed_secret_pw",
      businessId: mockBusiness._id,
      role: "owner",
      save: vi.fn(),
      toJSON: () => ({
        _id: "65f022222222222222222222",
        name: "Alice Owner",
        email: "alice@acme.com",
        role: "owner",
      }),
    };

    // Test Registration
    vi.spyOn(User, "findOne").mockResolvedValueOnce(null);
    vi.spyOn(Business, "findOne").mockResolvedValueOnce(null);
    vi.spyOn(Business, "create").mockResolvedValueOnce(mockBusiness as any);
    vi.spyOn(cryptoUtils, "hashPassword").mockResolvedValueOnce("hashed_secret_pw");
    vi.spyOn(User, "create").mockResolvedValueOnce(mockUser as any);

    const regReq: any = {
      body: {
        name: "Alice Owner",
        email: "alice@acme.com",
        password: "securePassword123!",
        businessName: "Acme Corp",
      },
    };
    const regRes = createMockResponse();

    await authController.register(regReq, regRes);

    expect(regRes.statusCode).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.token).toBeDefined();
    expect(regRes.body.data.user.email).toBe("alice@acme.com");

    // Test Login
    vi.spyOn(User, "findOne").mockResolvedValueOnce(mockUser as any);
    vi.spyOn(cryptoUtils, "verifyPassword").mockResolvedValueOnce(true);
    vi.spyOn(Business, "findById").mockResolvedValueOnce(mockBusiness as any);

    const loginReq: any = {
      body: {
        email: "alice@acme.com",
        password: "securePassword123!",
      },
    };
    const loginRes = createMockResponse();

    await authController.login(loginReq, loginRes);

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();
  });

  it("2. Unauthorized requests with invalid credentials are rejected with 401", async () => {
    vi.spyOn(User, "findOne").mockResolvedValueOnce(null);

    const req: any = {
      body: {
        email: "unknown@nowhere.com",
        password: "wrongPassword!",
      },
    };
    const res = createMockResponse();

    await authController.login(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Invalid email or password");
  });

  it("3. Protected dashboard endpoints require valid authentication", async () => {
    const req: any = {
      headers: {},
      cookies: {},
    };
    const res = createMockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Authentication required");
    expect(next).not.toHaveBeenCalled();
  });
});
