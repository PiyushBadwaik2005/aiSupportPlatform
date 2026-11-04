import jwt from "jsonwebtoken";
import { User, IUser } from "../../models/User";
import { Business, IBusiness } from "../../models/Business";
import { env } from "../../config/env";
import { hashPassword, verifyPassword } from "../../utils/crypto";
import { UserPayload } from "../../types";

export class AuthService {
  /**
   * Register a new business owner
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    businessName: string;
    website?: string;
  }): Promise<{ user: IUser; business: IBusiness; token: string }> {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    // Generate unique slug
    const baseSlug = data.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    let slug = baseSlug || "business";
    const existingSlug = await Business.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Create Business
    const business = await Business.create({
      name: data.businessName,
      slug,
      website: data.website,
    });

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create User as owner
    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      businessId: business._id,
      role: "owner",
    });

    // Link owner to business
    business.ownerId = user._id as any;
    await business.save();

    const token = this.generateToken({
      userId: (user._id as any).toString(),
      businessId: (business._id as any).toString(),
      email: user.email,
      role: user.role,
    });

    return { user, business, token };
  }

  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string): Promise<{ user: IUser; business: IBusiness; token: string }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password.");
    }

    const business = await Business.findById(user.businessId);
    if (!business) {
      throw new Error("Associated business could not be found.");
    }

    const token = this.generateToken({
      userId: (user._id as any).toString(),
      businessId: (business._id as any).toString(),
      email: user.email,
      role: user.role,
    });

    return { user, business, token };
  }

  generateToken(payload: UserPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  verifyToken(token: string): UserPayload {
    return jwt.verify(token, env.JWT_SECRET) as UserPayload;
  }
}

export const authService = new AuthService();

