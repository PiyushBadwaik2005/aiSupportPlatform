import mongoose, { Document as MDocument, Schema } from "mongoose";

export interface IApiUsage extends MDocument {
  businessId: mongoose.Types.ObjectId;
  apiKeyId?: mongoose.Types.ObjectId;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  tokensUsed?: number;
  isSuccess: boolean;
  errorMessage?: string;
  timestamp: Date;
}

const ApiUsageSchema = new Schema<IApiUsage>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    apiKeyId: { type: Schema.Types.ObjectId, ref: "ApiKey", index: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseTimeMs: { type: Number, required: true },
    tokensUsed: { type: Number, default: 0 },
    isSuccess: { type: Boolean, required: true },
    errorMessage: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

ApiUsageSchema.index({ businessId: 1, timestamp: -1 });
ApiUsageSchema.index({ apiKeyId: 1, timestamp: -1 });

export const ApiUsage = mongoose.model<IApiUsage>("ApiUsage", ApiUsageSchema);

