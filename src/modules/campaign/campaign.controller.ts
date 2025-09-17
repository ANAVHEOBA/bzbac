import { Request, Response } from 'express';
import multer from 'multer';
import { campaignCreateSchema, campaignPatchSchema } from './campaign.schema';
import { createCampaign, findCampaignBySlug, listCampaigns } from './campaign.crud';
import { uploadVideo } from '../../services/cloudinary';
import { uploadToFilestack } from '../../services/filestack'; // <-- NEW
import { CampaignModel } from './campaign.model';
import { cache } from '../../utils/cache';

/* ---------- small helper: retry wrapper ---------- */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function cloudinaryWithRetry(buffer: Buffer, publicId: string) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await uploadVideo(buffer, publicId);
    } catch (err) {
      lastErr = err;
      if (attempt === 3) break;
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }
  throw lastErr;
}

/* ---------- size-based uploader (used in both create & update) ---------- */
async function uploadSingleVideo(buffer: Buffer, publicId: string) {
  const sizeMB = buffer.length / 1024 / 1024;
  if (sizeMB <= 70) {
    console.log('🚀 using Cloudinary (≤70 MB)');
    return cloudinaryWithRetry(buffer, publicId);
  }
  console.log('🚀 using Filestack (>70 MB)');
  return uploadToFilestack(buffer, publicId);
}

/* ---------- JSON-only create ---------- */
export const create = async (req: Request, res: Response) => {
  try {
    const payload = campaignCreateSchema.parse(req.body);
    const campaign = await createCampaign(payload);
    await cache.invalidate('campaign:*');
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
  const cacheKey = `campaign:${slug}`;

  let campaign = await cache.get(cacheKey);
  if (!campaign) {
    campaign = await CampaignModel.findOne(
      { slug },
      {
        _id: 0,
        fullVideoUrl: 1,
        fullThumbnailUrl: 1,
        waLink: 1,
        waButtonLabel: 1,
        caption: 1,
        popupTriggerType: 1,
        popupTriggerValue: 1,//aa
        createdAt: 1,
        updatedAt: 1,
      }
    ).lean();

    if (!campaign) return res.status(404).json({ message: 'Not found' });
    await cache.set(cacheKey, campaign);
  }

  res.json(campaign);
};

/* ---------- single-shot upload ---------- */
const upload = multer({ storage: multer.memoryStorage() });

export const uploadCampaign = async (req: Request, res: Response) => {
  req.setTimeout(120_000); // Filestack may be slower

  try {
    const files = req.files as { [field: string]: Express.Multer.File[] };
    console.log('📁 files received:', Object.keys(files || {}));

    if (!files || !files.full?.[0]) {
      return res.status(400).json({ message: 'Full video file is required' });
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

    const file = files.full[0];
    const { secure_url, thumbnail_url } = await uploadSingleVideo(file.buffer, `${slug}_full`);

    const campaign = await createCampaign({
      slug,
      fullVideoUrl: secure_url,
      fullThumbnailUrl: thumbnail_url,
      waLink,
      waButtonLabel,
      caption,
      popupTriggerType,
      popupTriggerValue,
    });

    await cache.invalidate('campaign:*');
    res.status(201).json(campaign);
  } catch (err: any) {
    console.error('💥 uploadCampaign:', err);
    res.status(502).json({ message: err.message || 'Upload failed' });
  }
};

/* ---------- public links ---------- */
export const listPublicLinks = async (_req: Request, res: Response) => {
  const campaigns = await CampaignModel.find()
    .select('slug fullVideoUrl fullThumbnailUrl waLink waButtonLabel popupTriggerType popupTriggerValue')
    .sort({ createdAt: -1 })
    .lean();

  const links = campaigns.map(c => ({
    slug: c.slug,
    fullVideoUrl: c.fullVideoUrl,
    fullThumbnailUrl: c.fullThumbnailUrl,
    waLink: c.waLink,
    waButtonLabel: c.waButtonLabel,
    popupTriggerType: c.popupTriggerType,
    popupTriggerValue: c.popupTriggerValue,
  }));

  res.json(links);
};

/* ---------- DELETE endpoint ---------- */
export const remove = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const deleted = await CampaignModel.findOneAndDelete({ slug });
    if (!deleted) return res.status(404).json({ message: 'Campaign not found' });
    await cache.invalidate('campaign:*');
    res.json({ message: 'Campaign deleted', slug });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- meta tags for link unfurl ---------- */
export const getMetaTags = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const campaign = await CampaignModel.findOne(
      { slug },
      { _id: 0, slug: 1, caption: 1, fullThumbnailUrl: 1 }
    );
    if (!campaign) return res.status(404).send('Campaign not found');

    const title = campaign.slug;
    const description = campaign.caption || `${campaign.slug} video`;
    const image = campaign.fullThumbnailUrl;
    const url = `https://bzfront.vercel.app/campaigns/${encodeURIComponent(slug)}`;

    const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="video.other" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta http-equiv="refresh" content="0;url=${url}" />
  </head>
  <body></body>
</html>`.trim();

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- UPDATE (JSON or file) ---------- */
export const update = async (req: Request, res: Response) => {
  try {
    const rawSlug = req.params.slug?.toString().trim();
    if (!rawSlug) return res.status(400).json({ message: 'slug param missing' });

    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
    const hasFile = !!files?.full?.[0];
    let payload: any;

    if (hasFile) {
      const file = files.full[0];
      const { secure_url, thumbnail_url } = await uploadSingleVideo(file.buffer, `${rawSlug}_full`);
      payload = { ...req.body, fullVideoUrl: secure_url, fullThumbnailUrl: thumbnail_url };
    } else {
      payload = campaignPatchSchema.parse(req.body);
    }

    const updated = await CampaignModel.findOneAndUpdate({ slug: rawSlug }, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Campaign not found' });

    await cache.invalidate('campaign:*');
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.errors?.[0]?.message || err.message });
  }
};