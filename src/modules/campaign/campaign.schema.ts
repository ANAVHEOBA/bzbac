import { z } from 'zod';

export const campaignCreateSchema = z.object({
  slug: z.string().trim().min(1),
  fullVideoUrl: z.string().url(),
  fullThumbnailUrl: z.string().url(),
  waLink: z.string().trim().min(1),
  waButtonLabel: z.string().min(1).default('Chat on WhatsApp'),
  caption: z.string().optional(),
  popupTriggerType: z.enum(['seconds', 'percent']).nullable().default(null),
  popupTriggerValue: z.number().nullable().default(null),
});

export const campaignPatchSchema = campaignCreateSchema.partial();