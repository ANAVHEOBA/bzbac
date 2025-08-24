export interface CampaignDto {
  slug: string;
  snapVideoUrl: string;
  fullVideoUrl: string;
  snapThumbnailUrl: string;   // NEW
  fullThumbnailUrl: string;   // NEW
  waLink: string;
  caption?: string;
}