// src/modules/campaign/campaign.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaign extends Document {
  slug: string;
  snapVideoUrl: string;
  fullVideoUrl: string;
  snapThumbnailUrl: string;
  fullThumbnailUrl: string;
  waLink: string;
  waButtonLabel: string;
  caption?: string;

  /* NEW – popup timing */
  popupTriggerType: 'seconds' | 'percent' | null;
  popupTriggerValue: number | null;

  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    snapVideoUrl: { type: String, required: true },
    fullVideoUrl: { type: String, required: true },
    snapThumbnailUrl: { type: String, required: true },
    fullThumbnailUrl: { type: String, required: true },
    waLink: { type: String, required: true },
    waButtonLabel: { type: String, required: true, default: 'Chat on WhatsApp' },
    caption: { type: String, default: '' },

    /* NEW – nullable */
    popupTriggerType:  { type: String, enum: ['seconds', 'percent', null], default: null },
    popupTriggerValue: { type: Number,  default: null },
  },
  { timestamps: true }
);

export const CampaignModel = mongoose.model<ICampaign>('Campaign', campaignSchema);