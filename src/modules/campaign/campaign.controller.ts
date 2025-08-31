// src/modules/campaign/campaign.controller.ts
import { Request, Response } from 'express';
import multer from 'multer';
import { campaignCreateSchema, campaignPatchSchema } from './campaign.schema';
import { createCampaign, findCampaignBySlug, listCampaigns } from './campaign.crud';
import { uploadVideo } from '../../services/cloudinary';
import { CampaignModel } from './campaign.model';
import { cache } from '../../utils/cache';        // <-- NEW

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
    await cache.invalidate('campaign:*');          // <-- NEW
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
        slug: 1,
        snapVideoUrl: 1,
        fullVideoUrl: 1,
        snapThumbnailUrl: 1,
        fullThumbnailUrl: 1,
        waLink: 1,
        waButtonLabel: 1,
        caption: 1,
        popupTriggerType: 1,
        popupTriggerValue: 1,
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

// src/modules/campaign/campaign.controller.ts
export const uploadCampaign = async (req: Request, res: Response) => {
  req.setTimeout(60_000);

  try {
    /* ---------- basic validation ---------- */
    const files = req.files as { [field: string]: Express.Multer.File[] };
    console.log('📁 files received:', Object.keys(files || {}));

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
    console.log('🆔 slug:', slug, 'waLink:', waLink);

    if (!slug || !waLink) {
      return res.status(400).json({ message: 'slug and waLink are required' });
    }

    /* ---------- upload to Cloudinary ---------- */
    console.log('🚀 starting Cloudinary uploads…');
    let previewRes, fullRes;
    try {
      [previewRes, fullRes] = await Promise.all([
        uploadWithRetry(files.preview[0].buffer, `${slug}_preview`),
        uploadWithRetry(files.full[0].buffer, `${slug}_full`),
      ]);
      console.log('✅ Cloudinary done:', { previewRes, fullRes });
    } catch (cloudErr: any) {
      console.error('☁️ Cloudinary error:', cloudErr.message || cloudErr);
      return res.status(502).json({ message: 'Cloudinary upload failed', detail: cloudErr.message });
    }

    /* ---------- create DB doc ---------- */
    console.log('📝 creating campaign doc…');
    let campaign;
    try {
      campaign = await createCampaign({
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
      console.log('✅ campaign saved:', campaign._id);
    } catch (dbErr: any) {
      console.error('🗄️ DB error:', dbErr.message || dbErr);
      return res.status(409).json({ message: 'DB save failed', detail: dbErr.message });
    }

    /* ---------- cache invalidation ---------- */
    try {
      await cache.invalidate('campaign:*');
      console.log('💨 cache invalidated');
    } catch (cacheErr: any) {
      console.warn('⚠️ cache invalidate failed:', cacheErr.message);
    }

    /* ---------- success ---------- */
    return res.status(201).json(campaign);
  } catch (fatal: any) {
    console.error('💥 top-level catch:', fatal);
    res.status(500).json({ message: fatal.message || 'Upload failed' });
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
    await cache.invalidate('campaign:*');          // <-- NEW
    res.json({ message: 'Campaign deleted', slug });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- NEW: meta tags for link unfurl ---------- */
export const getMetaTags = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const campaign = await CampaignModel.findOne(
      { slug },
      {
        _id: 0,
        slug: 1,
        caption: 1,
        fullThumbnailUrl: 1,
      }
    );

    if (!campaign) {
      return res.status(404).send('Campaign not found');
    }

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

    <!-- Open-Graph -->
    <meta property="og:type"        content="video.other" />
    <meta property="og:title"       content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image"       content="${image}" />
    <meta property="og:url"         content="${url}" />

    <!-- Twitter Card -->
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image"       content="${image}" />

    <!-- Redirect humans -->
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




export const update = async (req: Request, res: Response) => {
  try {
    /* ---------- 0. sanitize slug ---------- */
    const rawSlug = req.params.slug?.toString().trim();
    if (!rawSlug) {
      return res.status(400).json({ message: 'slug param is missing or empty' });
    }

    /* ---------- 1. detect file presence ---------- */
    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
    const hasFiles = !!(files?.preview?.[0] || files?.full?.[0]);

    /* ---------- 2. build payload ---------- */
    let payload: any;

    if (hasFiles) {
      if (!files!.preview?.[0] || !files!.full?.[0]) {
        return res.status(400).json({ message: 'Both preview & full files required' });
      }

      try {
        const [previewRes, fullRes] = await Promise.all([
          uploadWithRetry(files!.preview[0].buffer, `${rawSlug}_preview`),
          uploadWithRetry(files!.full[0].buffer, `${rawSlug}_full`),
        ]);

        payload = {
          ...req.body,
          snapVideoUrl: previewRes.secure_url,
          fullVideoUrl: fullRes.secure_url,
          snapThumbnailUrl: previewRes.thumbnail_url,
          fullThumbnailUrl: fullRes.thumbnail_url,
        };
      } catch (cloudErr: any) {
        console.error('☁️ Cloudinary upload error:', cloudErr);
        return res.status(502).json({ message: 'Cloudinary upload failed', detail: cloudErr.message });
      }
    } else {
      /* JSON-only mode */
      payload = campaignPatchSchema.parse(req.body);
    }

    /* ---------- 3. lookup & update ---------- */
    console.log('🔍 Updating campaign with slug:', JSON.stringify(rawSlug));
    const updated = await CampaignModel.findOneAndUpdate(
      { slug: rawSlug },        // exact, trimmed match
      payload,
      { new: true, runValidators: true }
    );

    if (!updated) {
      console.warn('⚠️ No campaign matched slug:', rawSlug);
      return res.status(404).json({ message: 'Campaign not found' });
    }

    /* ---------- 4. invalidate cache ---------- */
    try {
      await cache.invalidate('campaign:*');
    } catch (cacheErr) {
      console.warn('⚠️ Cache invalidation failed:', cacheErr);
    }

    /* ---------- 5. respond ---------- */
    res.json(updated);
  } catch (err: any) {
    console.error('💥 UPDATE endpoint error:', err);
    res.status(400).json({ message: err.errors?.[0]?.message || err.message });
  }
};

