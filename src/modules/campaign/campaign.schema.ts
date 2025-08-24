// src/modules/campaign/campaign.schema.ts
import { z } from 'zod';

export const campaignCreateSchema = z.object({
  slug: z.string().trim().min(1),
  snapVideoUrl: z.string().pipe(z.url()),
  fullVideoUrl: z.string().pipe(z.url()),
  snapThumbnailUrl: z.string().pipe(z.url()),  // NEW
  fullThumbnailUrl: z.string().pipe(z.url()),  // NEW
  waLink: z.string().pipe(z.url()),
  caption: z.string().optional(),
});