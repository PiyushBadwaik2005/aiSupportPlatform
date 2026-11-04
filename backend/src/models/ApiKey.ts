import mongoose, { Document as MDocument, Schema } from "mongoose";

export interface IApiKey extends MDocument {
  businessId: mongoose.Types.ObjectId;
  name: string;
  keyPrefix: string;
  hashedSecret: string;
  status: "active" | "revoked";
  permissions: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    name: { type: String, required: true, trim: true },
    keyPrefix: { type: String, required: true, index: true },
    hashedSecret: { type: String, required: true },
    status: { type: String, enum: ["active", "revoked"], default: "active", index: true },
    permissions: { type: [String], default: ["chat:read", "chat:write"] },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Never return hashedSecret in JSON responses
ApiKeySchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.hashedSecret;
    return ret;
  },
});

ApiKeySchema.index({ keyPrefix: 1, status: 1 });
ApiKeySchema.index({ businessId: 1, createdAt: -1 });

export const ApiKey = mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
