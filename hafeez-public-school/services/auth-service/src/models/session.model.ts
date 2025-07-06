import mongoose, { Schema, Document } from 'mongoose';
import { ISession } from '@/types';

export interface ISessionDocument extends Omit<ISession, '_id'>, Document {}

const sessionSchema = new Schema<ISessionDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user sessions
sessionSchema.index({ userId: 1, createdAt: -1 });

export const Session = mongoose.model<ISessionDocument>(
  'Session',
  sessionSchema
);
