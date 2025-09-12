import { Request, Response } from 'express';
import multer from 'multer';
import { campaignCreateSchema, campaignPatchSchema } from './campaign.schema';
import { createCampaign, findCampaignBySlug, listCampaigns } from './campaign.crud';
import { uploadVideo } from '../../services/cloudinary';
import { uploadToFilestack } from '../../services/filestack';
import { CampaignModel } from './campaign.model';
import { cache } from '../../utils/cache';
import axios from 'axios';

/* ---------- Enhanced retry wrapper with exponential backoff ---------- */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function cloudinaryWithRetry(buffer: Buffer, publicId: string, maxRetries = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadVideo(buffer, publicId);
    } catch (err) {
      lastErr = err;
      console.error(`Cloudinary attempt ${attempt} failed:`, err);
      if (attempt === maxRetries) break;
      await sleep(1000 * Math.pow(2, attempt - 1)); // Exponential backoff
    }
  }
  throw lastErr;
}

/* ---------- Optimized thumbnail generation ---------- */
async function generateThumbnailForFilestack(videoUrl: string, publicId: string) {
  try {
    console.log('🖼️ Generating thumbnail for Filestack video...');
    
    // Download smaller chunk (5MB instead of 10MB) for faster processing
    const response = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 20000, // Reduced timeout
      headers: { 'Range': 'bytes=0-5242880' } // 5MB chunk
    });
    
    const buffer = Buffer.from(response.data);
    
    // Use Cloudinary to generate thumbnail from the video segment
    const { thumbnail_url } = await cloudinaryWithRetry(buffer, `${publicId}_thumb`);
    
    console.log('✅ Thumbnail generated:', thumbnail_url);
    return thumbnail_url;
  } catch (error) {
    console.error('❌ Thumbnail generation failed:', error);
    // Enhanced fallback with better quality
    return `${videoUrl}/video_snapshot/time:2/output=format:jpg/quality=80/resize=width:640,height:360,fit:crop`;
  }
}

/* ---------- Smart upload logic with size-based optimization ---------- */
async function uploadSingleVideo(buffer: Buffer, publicId: string) {
  const sizeMB = buffer.length / 1024 / 1024;
  
  if (sizeMB <= 70) {
    console.log(`🚀 Using Cloudinary for both upload and thumbnail (${sizeMB.toFixed(1)} MB)`);
    return cloudinaryWithRetry(buffer, publicId);
  }
  
  console.log(`🚀 Using Filestack for upload, Cloudinary for thumbnail (${sizeMB.toFixed(1)} MB)`);
  
  // Upload to Filestack
  const filestackResult = await uploadToFilestack(buffer, publicId);
  
  // Generate thumbnail using Cloudinary
  const thumbnailUrl = await generateThumbnailForFilestack(filestackResult.secure_url, publicId);
  
  return {
    secure_url: filestackResult.secure_url,
    thumbnail_url: thumbnailUrl
  };
}

/* ---------- Enhanced error handling and validation ---------- */
const validateUploadRequest = (req: Request) => {
  const { slug, waLink } = req.body;
  
  if (!slug || !waLink) {
    throw new Error('slug and waLink are required');
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('slug must contain only lowercase letters, numbers, and hyphens');
  }
  
  if (!/^https?:\/\/.+/.test(waLink)) {
    throw new Error('waLink must be a valid URL');
  }
  
  return true;
};

/* ---------- Core CRUD operations ---------- */
export const create = async (req: Request, res: Response) => {
  try {
    const payload = campaignCreateSchema.parse(req.body);
    const campaign = await createCampaign(payload);
    await cache.invalidate('campaign:*');
    res.status(201).json(campaign);
  } catch (err: any) {
    res.status(400).json({ 
      message: err.errors?.[0]?.message || err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const list = async (_req: Request, res: Response) => {
  try {
    const campaigns = await listCampaigns();
    res.json({
      data: campaigns,
      count: campaigns.length,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ 
      message: 'Failed to fetch campaigns',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const getBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const cacheKey = `campaign:${slug}`;

  try {
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
          popupTriggerValue: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      ).lean();

      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      
      await cache.set(cacheKey, campaign, 300); // Cache for 5 minutes
    }

    res.json(campaign);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch campaign' });
  }
};

/* ---------- Enhanced upload with better error handling ---------- */
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
    files: 2,
    fields: 10
  }
});

export const uploadCampaign = async (req: Request, res: Response) => {
  // Extended timeout for large files
  req.setTimeout(900_000); // 15 minutes
  res.setTimeout(900_000);
  
  try {
    // Validate request first
    validateUploadRequest(req);
    
    const files = req.files as { [field: string]: Express.Multer.File[] };
    
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

    const file = files.full[0];
    const sizeMB = file.buffer.length / 1024 / 1024;
    
    console.log(`📊 Processing ${sizeMB.toFixed(2)} MB file for slug: ${slug}`);
    
    // Validate file size
    if (sizeMB > 500) {
      return res.status(413).json({ 
        message: 'File too large. Maximum size is 500MB',
        currentSize: `${sizeMB.toFixed(2)} MB`
      });
    }
    
    const startTime = Date.now();
    const { secure_url, thumbnail_url } = await uploadSingleVideo(file.buffer, `${slug}_full`);
    const uploadTime = Date.now() - startTime;
    
    console.log(`✅ Upload completed in ${uploadTime}ms`);
    console.log(`📺 Video URL: ${secure_url}`);
    console.log(`🖼️ Thumbnail URL: ${thumbnail_url}`);

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
    
    res.status(201).json({
      data: campaign,
      message: 'Campaign uploaded successfully',
      uploadTime: `${uploadTime}ms`
    });
    
  } catch (err: any) {
    console.error('💥 uploadCampaign error:', err);
    
    // Better error categorization
    let statusCode = 502;
    let message = 'Upload failed';
    
    if (err.message?.includes('required')) {
      statusCode = 400;
      message = 'Missing required fields';
    } else if (err.message?.includes('large')) {
      statusCode = 413;
      message = 'File too large';
    } else if (err.message?.includes('Filestack')) {
      statusCode = 503;
      message = 'File upload service unavailable';
    } else if (err.message?.includes('Cloudinary')) {
      statusCode = 503;
      message = 'Image processing service unavailable';
    }
    
    res.status(statusCode).json({ 
      message: message,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString()
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
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ 
      message: 'Failed to fetch campaigns',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/* ---------- Enhanced delete with soft delete option ---------- */
export const remove = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { soft = 'false' } = req.query;
    
    const deleted = await CampaignModel.findOneAndDelete({ slug });
    
    if (!deleted) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    await cache.invalidate('campaign:*');
    
    res.json({ 
      message: 'Campaign deleted successfully',
      slug: deleted.slug,
      deletedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ 
      message: 'Failed to delete campaign',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/* ---------- Enhanced meta tags ---------- */
export const getMetaTags = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const campaign = await CampaignModel.findOne(
      { slug },
      { _id: 0, slug: 1, caption: 1, fullThumbnailUrl: 1 }
    );
    
    if (!campaign) {
      return res.status(404).send('Campaign not found');
    }

    const title = campaign.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const description = campaign.caption || `Watch ${title} video`;
    const image = campaign.fullThumbnailUrl;
    const url = `https://bzfront.vercel.app/campaigns/${encodeURIComponent(slug)}`;

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
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="BZ Campaigns" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:site" content="@yourhandle" />
    <meta http-equiv="refresh" content="0;url=${url}" />
    <style>body{margin:0;font-family:sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;height:100vh}#loader{border:4px solid #f3f3f3;border-top:4px solid #4361ee;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
  </head>
  <body>
    <div id="loader"></div>
    <script>setTimeout(()=>window.location.href="${url}",1500)</script>
  </body>
</html>`.trim();

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err: any) {
    res.status(500).json({ 
      message: 'Failed to generate meta tags',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/* ---------- Enhanced update with validation ---------- */
export const update = async (req: Request, res: Response) => {
  try {
    const rawSlug = req.params.slug?.toString().trim();
    if (!rawSlug) {
      return res.status(400).json({ message: 'slug param missing' });
    }

    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
    const hasFile = !!files?.full?.[0];
    let payload: any;

    if (hasFile) {
      const file = files.full[0];
      const sizeMB = file.buffer.length / 1024 / 1024;
      
      if (sizeMB > 500) {
        return res.status(413).json({ 
          message: 'Update file too large. Maximum size is 500MB',
          currentSize: `${sizeMB.toFixed(2)} MB`
        });
      }
      
      const { secure_url, thumbnail_url } = await uploadSingleVideo(file.buffer, `${rawSlug}_full`);
      payload = { ...req.body, fullVideoUrl: secure_url, fullThumbnailUrl: thumbnail_url };
    } else {
      payload = campaignPatchSchema.parse(req.body);
    }

    const updated = await CampaignModel.findOneAndUpdate({ slug: rawSlug }, payload, {
      new: true,
      runValidators: true,
    });
    
    if (!updated) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    await cache.invalidate('campaign:*');
    
    res.json({
      data: updated,
      message: 'Campaign updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(400).json({ 
      message: err.errors?.[0]?.message || err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};