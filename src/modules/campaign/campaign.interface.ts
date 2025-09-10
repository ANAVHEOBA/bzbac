export interface CampaignDto {
  slug: string;
  fullVideoUrl: string;
  fullThumbnailUrl: string;
  waLink: string;
  waButtonLabel: string;
  caption?: string;
  popupTriggerType: 'seconds' | 'percent' | null;
  popupTriggerValue: number | null;
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
}