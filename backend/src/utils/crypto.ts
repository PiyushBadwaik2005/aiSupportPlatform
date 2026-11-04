import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a new API key.
 * Returns the public key representation for the user (only displayed once!)
 * and the hash to be stored in the database.
 */
export function generateApiKey(): {
  rawKey: string;
  keyPrefix: string;
  hashedSecret: string;
} {
  const prefix = "aisp_live_";
  // 6 character public identifier for rapid lookup
  const keyIdentifier = crypto.randomBytes(4).toString("hex");
  // 32 byte secret
  const secret = crypto.randomBytes(32).toString("hex");

  const rawKey = `${prefix}${keyIdentifier}_${secret}`;
  const keyPrefix = `${prefix}${keyIdentifier}`;
  const hashedSecret = hashApiKeySecret(secret);

  return {
    rawKey,
    keyPrefix,
    hashedSecret,
  };
}

/**
 * Hash an API key secret with a server pepper using HMAC-SHA256
 */
export function hashApiKeySecret(secret: string): string {
  return crypto
    .createHmac("sha256", env.API_KEY_PEPPER)
    .update(secret)
    .digest("hex");
}

/**
 * Constant-time hash comparison
 */
export function verifyApiKeySecret(providedSecret: string, storedHash: string): boolean {
  const computedHash = hashApiKeySecret(providedSecret);
  const bufferA = Buffer.from(computedHash, "hex");
  const bufferB = Buffer.from(storedHash, "hex");

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Generate a public-chat token (for embeddable widget or public demo)
 * scoped strictly to a business ID and expiry.
 */
export function generatePublicChatToken(businessId: string): string {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac("sha256", env.AUTH_SESSION_SECRET)
    .update(`${businessId}:${timestamp}`)
    .digest("hex");
  return Buffer.from(JSON.stringify({ businessId, timestamp, signature })).toString("base64url");
}

export function verifyPublicChatToken(token: string): { valid: boolean; businessId?: string } {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const { businessId, timestamp, signature } = JSON.parse(raw);

    // 24 hour expiry for public chat token
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      return { valid: false };
    }

    const expectedSig = crypto
      .createHmac("sha256", env.AUTH_SESSION_SECRET)
      .update(`${businessId}:${timestamp}`)
      .digest("hex");

    const match = crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSig, "hex"));
    return { valid: match, businessId: match ? businessId : undefined };
  } catch {
    return { valid: false };
  }
}

