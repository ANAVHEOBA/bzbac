// src/modules/admin/admin.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const AdminModel = mongoose.model<IAdmin>('Admin', adminSchema);