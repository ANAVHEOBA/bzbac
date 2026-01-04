import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  campaignSlug: string;
  date: string;
  bySource: Map<string, { views: number; plays: number; completes: number; clicks: number }>;
  totalViews: number;
  totalPlays: number;
  totalCompletes: number;
  totalClicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    campaignSlug: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    bySource: {
      type: Map,
      of: {
        views: { type: Number, default: 0 },
        plays: { type: Number, default: 0 },
        completes: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
      },
      default: {},
    },
    totalViews: { type: Number, default: 0 },
    totalPlays: { type: Number, default: 0 },
    totalCompletes: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

analyticsSchema.index({ campaignSlug: 1, date: 1 }, { unique: true });

export const AnalyticsModel = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
