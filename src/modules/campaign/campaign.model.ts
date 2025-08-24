import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaign extends Document {
  slug: string;
  snapVideoUrl: string;
  fullVideoUrl: string;
  snapThumbnailUrl: string;   // NEW
  fullThumbnailUrl: string;   // NEW
  waLink: string;
  caption?: string;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    slug:              { type: String, required: true, unique: true, trim: true },
    snapVideoUrl:      { type: String, required: true },
    fullVideoUrl:      { type: String, required: true },
    snapThumbnailUrl:  { type: String, required: true },  // NEW
    fullThumbnailUrl:  { type: String, required: true },  // NEW
    waLink:            { type: String, required: true },
    caption:           { type: String, default: '' },
  },
  { timestamps: true }
);

export const CampaignModel = mongoose.model<ICampaign>('Campaign', campaignSchema);