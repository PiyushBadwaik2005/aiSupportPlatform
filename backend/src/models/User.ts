import mongoose, { Document as MDocument, Schema } from "mongoose";

export interface IUser extends MDocument {
  name: string;
  email: string;
  passwordHash: string;
  businessId: mongoose.Types.ObjectId;
  role: "owner" | "admin" | "member";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "owner" },
  },
  { timestamps: true }
);

// Do not return passwordHash in JSON
UserSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.model<IUser>("User", UserSchema);
