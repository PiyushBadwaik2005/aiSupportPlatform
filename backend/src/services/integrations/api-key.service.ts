import mongoose from "mongoose";
import { ApiKey, IApiKey } from "../../models/ApiKey";
import { ApiUsage } from "../../models/ApiUsage";
import { generateApiKey, verifyApiKeySecret } from "../../utils/crypto";
import { logger } from "../../utils/logger";

export class ApiKeyService {
  /**
   * Create a new API key for a business.
   * Note: rawKey is ONLY returned here and is never stored or displayed again.
   */
  async createKey(
    businessId: string,
    name: string,
    userId?: string,
    permissions = ["chat:read", "chat:write"]
  ): Promise<{ apiKey: IApiKey; rawKey: string }> {
    const { rawKey, keyPrefix, hashedSecret } = generateApiKey();

    const apiKey = await ApiKey.create({
      businessId: new mongoose.Types.ObjectId(businessId),
      name,
      keyPrefix,
      hashedSecret,
      status: "active",
      permissions,
      createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    });

    logger.info("API Key created", { businessId, keyId: apiKey._id, keyPrefix });

    return { apiKey, rawKey };
  }

  /**
   * Validate an incoming raw API key
   */
  async validateKey(rawKey: string): Promise<IApiKey | null> {
    if (!rawKey || !rawKey.startsWith("aisp_live_")) {
      return null;
    }

    // Split key into prefix and secret: "aisp_live_abc123_xyz..."
    const parts = rawKey.split("_");
    if (parts.length < 4) {
      return null;
    }

    const keyPrefix = `${parts[0]}_${parts[1]}_${parts[2]}`;
    const secret = parts.slice(3).join("_");

    const apiKey = await ApiKey.findOne({ keyPrefix, status: "active" });
    if (!apiKey) {
      return null;
    }

    const isValid = verifyApiKeySecret(secret, apiKey.hashedSecret);
    if (!isValid) {
      return null;
    }

    // Update last used timestamp asynchronously
    ApiKey.findByIdAndUpdate(apiKey._id, { lastUsedAt: new Date() }).exec();

    return apiKey;
  }

  /**
   * Revoke an existing API key
   */
  async revokeKey(keyId: string, businessId: string): Promise<boolean> {
    const res = await ApiKey.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(keyId),
        businessId: new mongoose.Types.ObjectId(businessId),
      },
      { status: "revoked" }
    );
    return Boolean(res);
  }

  /**
   * Rotate an API key: revoke old key and generate new key
   */
  async rotateKey(
    keyId: string,
    businessId: string,
    userId?: string
  ): Promise<{ apiKey: IApiKey; rawKey: string }> {
    const oldKey = await ApiKey.findOne({
      _id: new mongoose.Types.ObjectId(keyId),
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!oldKey) {
      throw new Error("Key not found or access denied.");
    }

    // Revoke old key
    oldKey.status = "revoked";
    await oldKey.save();

    // Create new key with same name and permissions
    return this.createKey(businessId, `${oldKey.name} (Rotated)`, userId, oldKey.permissions);
  }

  /**
   * Record API request usage
   */
  async recordUsage(data: {
    businessId: string;
    apiKeyId?: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTimeMs: number;
    tokensUsed?: number;
    isSuccess: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await ApiUsage.create({
        businessId: new mongoose.Types.ObjectId(data.businessId),
        apiKeyId: data.apiKeyId ? new mongoose.Types.ObjectId(data.apiKeyId) : undefined,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        responseTimeMs: data.responseTimeMs,
        tokensUsed: data.tokensUsed || 0,
        isSuccess: data.isSuccess,
        errorMessage: data.errorMessage,
        timestamp: new Date(),
      });
    } catch (err: any) {
      logger.error("Failed to record API usage", { error: err.message });
    }
  }
}

export const apiKeyService = new ApiKeyService();

