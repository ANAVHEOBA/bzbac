// src/modules/campaign/campaign.controller.ts  (COMPLETE, updated)
import { Request, Response } from 'express';
import multer from 'multer';
import { campaignCreateSchema } from './campaign.schema';
import { createCampaign, findCampaignBySlug, listCampaigns } from './campaign.crud';
import { uploadVideo } from '../../services/cloudinary';
import { CampaignModel } from './campaign.model';

/* ---------- small helper: retry wrapper ---------- */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function uploadWithRetry(
  buffer: Buffer,
  publicId: string,
  maxTries = 3,
  baseDelay = 1000
) {
  let lastErr;
  for (let attempt = 1; attempt <= maxTries; attempt++) {
    try {
      return await uploadVideo(buffer, publicId);
    } catch (err) {
      lastErr = err;
      if (attempt === maxTries) break;
      await sleep(baseDelay * 2 ** (attempt - 1));
    }
  }
  throw lastErr;
}

/* ---------- legacy JSON create ---------- */
export const create = async (req: Request, res: Response) => {
  try {
    const payload = campaignCreateSchema.parse(req.body);
    const campaign = await createCampaign(payload);
    res.status(201).json(campaign);
  } catch (err: any) {
    res.status(400).json({ message: err.errors?.[0]?.message || err.message });
  }
};

/* ---------- list & public landing ---------- */
export const list = async (_req: Request, res: Response) => {
  const campaigns = await listCampaigns();
  res.json(campaigns);
};

export const getBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;

  const campaign = await CampaignModel.findOne(
    { slug },
    {
      _id: 0,
      slug: 1,
      snapVideoUrl: 1,
      fullVideoUrl: 1,
      snapThumbnailUrl: 1,
      fullThumbnailUrl: 1,
      waLink: 1,
      waButtonLabel: 1,
      caption: 1,
      popupTriggerType: 1,   // NEW
      popupTriggerValue: 1,  // NEW
      createdAt: 1,
      updatedAt: 1,
    }
  );

  if (!campaign) return res.status(404).json({ message: 'Not found' });
  res.json(campaign);
};

/* ---------- single-shot upload ---------- */
const upload = multer({ storage: multer.memoryStorage() });

export const uploadCampaign = async (req: Request, res: Response) => {
  req.setTimeout(60_000);

  try {
    const files = req.files as { [field: string]: Express.Multer.File[] };
    if (!files || !files.preview?.[0] || !files.full?.[0]) {
      return res.status(400).json({ message: 'Both preview and full files required' });
    }

    const {
      slug,
      caption = '',
      waLink,
      waButtonLabel = 'Chat on WhatsApp',
      popupTriggerType = null,
      popupTriggerValue = null,
    } = req.body;
    if (!slug || !waLink) {
      return res.status(400).json({ message: 'slug and waLink are required' });
    }

    const [previewRes, fullRes] = await Promise.all([
      uploadWithRetry(files.preview[0].buffer, `${slug}_preview`),
      uploadWithRetry(files.full[0].buffer, `${slug}_full`),
    ]);

    const campaign = await createCampaign({
      slug,
      snapVideoUrl: previewRes.secure_url,
      fullVideoUrl: fullRes.secure_url,
      snapThumbnailUrl: previewRes.thumbnail_url,
      fullThumbnailUrl: fullRes.thumbnail_url,
      waLink,
      waButtonLabel,
      caption,
      popupTriggerType,
      popupTriggerValue,
    });

    res.status(201).json(campaign);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
};

/* ---------- public links ---------- */
export const listPublicLinks = async (_req: Request, res: Response) => {
  try {
    const campaigns = await CampaignModel.find()
      .select('slug fullVideoUrl fullThumbnailUrl waLink waButtonLabel popupTriggerType popupTriggerValue')
      .sort({ createdAt: -1 });

    const links = campaigns.map(c => ({
      slug: c.slug,
      fullVideoUrl: c.fullVideoUrl,
      fullThumbnailUrl: c.fullThumbnailUrl,
      waLink: c.waLink,
      waButtonLabel: c.waButtonLabel,
      popupTriggerType:  c.popupTriggerType,
      popupTriggerValue: c.popupTriggerValue,
    }));
    res.json(links);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE endpoint ---------- */
export const remove = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const deleted = await CampaignModel.findOneAndDelete({ slug });
    if (!deleted) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ message: 'Campaign deleted', slug });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};