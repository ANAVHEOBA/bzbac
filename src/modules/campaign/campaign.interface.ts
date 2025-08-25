export interface CampaignDto {
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

  createdAt?: string;
  updatedAt?: string;
  _id?: string;
}