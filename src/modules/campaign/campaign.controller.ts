import { Request, Response } from 'express';
import multer from 'multer';
import { campaignCreateSchema, campaignPatchSchema } from './campaign.schema';
import { createCampaign, findCampaignBySlug, listCampaigns } from './campaign.crud';
import { uploadVideo } from '../../services/cloudinary';
import { uploadToFilestack } from '../../services/filestack';
import { CampaignModel } from './campaign.model';
import { cache } from '../../utils/cache';
import axios from 'axios';

/* ---------- Configuration ---------- */
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB limit
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks for large files
const UPLOAD_TIMEOUT = 900_000; // 15 minutes
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // Base delay in ms

/* ---------- Enhanced retry wrapper with exponential backoff ---------- */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function withRetry<T>(
  fn: () => Promise<T>, 
  attempts: number = RETRY_ATTEMPTS,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError;
  
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt} failed:`, err);
      
      if (attempt === attempts) break;
      
      const waitTime = delay * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`Retrying in ${waitTime}ms...`);
      await sleep(waitTime);
    }
  }
  
  throw lastError;
}

/* ---------- Optimized Cloudinary upload ---------- */
async function cloudinaryWithRetry(buffer: Buffer, publicId: string) {
  return withRetry(() => uploadVideo(buffer, publicId));
}

/* ---------- Enhanced thumbnail generation with better fallbacks ---------- */
async function generateThumbnailForFilestack(videoUrl: string, publicId: string) {
  try {
    console.log('🖼️ Generating thumbnail for Filestack video...');
    
    // Try multiple approaches for thumbnail generation
    const approaches = [
      // Approach 1: Download video segment and use Cloudinary
      async () => {
        const response = await axios.get(videoUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: { 'Range': 'bytes=0-5242880' } // First 5MB only
        });
        
        const buffer = Buffer.from(response.data);
        const { thumbnail_url } = await cloudinaryWithRetry(buffer, `${publicId}_thumb`);
        return thumbnail_url;
      },
      
      // Approach 2: Use Cloudinary's remote upload
      async () => {
        console.log('Trying Cloudinary remote upload...');
        const { secure_url } = await cloudinaryWithRetry(
          Buffer.from(''), // Empty buffer, we'll use the URL
          `${publicId}_remote`
        );
        return secure_url.replace(/\.[^.]+$/, '.jpg');
      }
    ];

    for (const approach of approaches) {
      try {
        const thumbnail = await approach();
        console.log('✅ Thumbnail generated:', thumbnail);
        return thumbnail;
      } catch (err) {
        console.warn('Thumbnail approach failed:', err);
        continue;
      }
    }
    
    // Final fallback: Filestack transformation
    console.log('Using Filestack fallback thumbnail...');
    return `${videoUrl}/video_snapshot/time:1/output=format:jpg/resize=width:640,height:360,fit:crop`;
    
  } catch (error) {
    console.error('❌ All thumbnail generation failed:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

/* ---------- Smart upload logic with size-based optimization ---------- */
async function uploadSingleVideo(buffer: Buffer, publicId: string) {
  const sizeMB = buffer.length / 1024 / 1024;
  
  // Validate file size
  if (sizeMB > 500) {
    throw new Error('File too large. Maximum size is 500MB');
  }
  
  console.log(`📊 Processing ${sizeMB.toFixed(2)} MB file...`);
  
  if (sizeMB <= 70) {
    console.log('🚀 Using Cloudinary for both upload and thumbnail (≤70 MB)');
    return cloudinaryWithRetry(buffer, publicId);
  }
  
  console.log('🚀 Using Filestack for upload, Cloudinary for thumbnail (>70 MB)');
  
  // For large files, upload to Filestack first
  const filestackResult = await withRetry(() => uploadToFilestack(buffer, publicId));
  
  // Generate thumbnail using Cloudinary
  const thumbnailUrl = await generateThumbnailForFilestack(filestackResult.secure_url, publicId);
  
  return {
    secure_url: filestackResult.secure_url,
    thumbnail_url: thumbnailUrl
  };
}

/* ---------- Enhanced error handling and validation ---------- */
const validateUpload = (files: any, body: any) => {
  if (!files?.full?.[0]) {
    throw new Error('Video file is required');
  }
  
  const { slug, waLink } = body;
  if (!slug?.trim()) throw new Error('Slug is required');
  if (!waLink?.trim()) throw new Error('WhatsApp link is required');
  
  const file = files.full[0];
  if (file.buffer.length > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 500MB');
  }
  
  return true;
};

/* ---------- Optimized upload endpoint ---------- */
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 20
  }
});

export const uploadCampaign = async (req: Request, res: Response) => {
  // Set extended timeout for large files
  req.setTimeout(UPLOAD_TIMEOUT);
  res.setTimeout(UPLOAD_TIMEOUT);
  
  // Set keep-alive headers
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', `timeout=${UPLOAD_TIMEOUT / 1000}`);
  
  try {
    console.log('📁 Upload request received');
    
    // Validate input
    validateUpload(req.files, req.body);
    
    const files = req.files as { [field: string]: Express.Multer.File[] };
    const {
      slug,
      caption = '',
      waLink,
      waButtonLabel = 'Chat on WhatsApp',
      popupTriggerType = null,
      popupTriggerValue = null,
    } = req.body;

    const file = files.full[0];
    const startTime = Date.now();
    
    // Process upload with comprehensive error handling
    const { secure_url, thumbnail_url } = await uploadSingleVideo(file.buffer, `${slug}_full`);
    
    const uploadTime = Date.now() - startTime;
    console.log(`✅ Upload completed in ${uploadTime}ms`);

    // Create campaign record
    const campaign = await createCampaign({
      slug: slug.trim(),
      fullVideoUrl: secure_url,
      fullThumbnailUrl: thumbnail_url,
      waLink: waLink.trim(),
      waButtonLabel: waButtonLabel.trim(),
      caption: caption.trim(),
      popupTriggerType,
      popupTriggerValue,
    });

    // Invalidate cache
    await cache.invalidate('campaign:*');
    
    // Send success response
    res.status(201).json({
      message: 'Campaign uploaded successfully',
      campaign,
      uploadTime: `${uploadTime}ms`
    });
    
  } catch (err: any) {
    console.error('💥 Upload failed:', err);
    
    // Send appropriate error response
    const statusCode = err.message.includes('required') ? 400 : 502;
    res.status(statusCode).json({ 
      message: err.message || 'Upload failed',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }
};

/* ---------- Enhanced public links with pagination ---------- */
export const listPublicLinks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const campaigns = await CampaignModel.find()
      .select('slug fullVideoUrl fullThumbnailUrl waLink waButtonLabel popupTriggerType popupTriggerValue')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await CampaignModel.countDocuments();
    
    res.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- Enhanced delete with soft delete option ---------- */
export const remove = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { permanent = false } = req.query;
    
    if (permanent === 'true') {
      // Permanent delete
      const deleted = await CampaignModel.findOneAndDelete({ slug });
      if (!deleted) return res.status(404).json({ message: 'Campaign not found' });
    } else {
      // Soft delete (mark as deleted)
      const updated = await CampaignModel.findOneAndUpdate(
        { slug }, 
        { deletedAt: new Date() }, 
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: 'Campaign not found' });
    }
    
    await cache.invalidate('campaign:*');
    res.json({ message: 'Campaign deleted successfully', slug });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- Enhanced meta tags with better SEO ---------- */
export const getMetaTags = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const campaign = await CampaignModel.findOne(
      { slug, deletedAt: null },
      { _id: 0, slug: 1, caption: 1, fullThumbnailUrl: 1, createdAt: 1 }
    );
    
    if (!campaign) return res.status(404).send('Campaign not found');

    const title = `${campaign.slug} - Video Campaign`;
    const description = campaign.caption || `Watch ${campaign.slug} video campaign`;
    const image = campaign.fullThumbnailUrl;
    const url = `https://bzfront.vercel.app/campaigns/${encodeURIComponent(slug)}`;
    const publishedTime = campaign.createdAt.toISOString();

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="video.other" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${url}" />
    <meta property="article:published_time" content="${publishedTime}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />
    <meta http-equiv="refresh" content="0;url=${url}" />
  </head>
  <body></body>
</html>`.trim();

    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- Enhanced update with validation ---------- */
export const update = async (req: Request, res: Response) => {
  try {
    const rawSlug = req.params.slug?.toString().trim();
    if (!rawSlug) return res.status(400).json({ message: 'Slug parameter is required' });

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

    const updated = await CampaignModel.findOneAndUpdate(
      { slug: rawSlug, deletedAt: null }, 
      payload, 
      { new: true, runValidators: true }
    );
    
    if (!updated) return res.status(404).json({ message: 'Campaign not found' });

    await cache.invalidate('campaign:*');
    res.json({ message: 'Campaign updated successfully', campaign: updated });
  } catch (err: any) {
    res.status(400).json({ message: err.errors?.[0]?.message || err.message });
  }
};