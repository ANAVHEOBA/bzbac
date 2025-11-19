// migrate-cloudinary.ts
// Migration script to transfer videos from old to new Cloudinary account
import mongoose from 'mongoose';
import { CampaignModel } from './src/modules/campaign/campaign.model';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// ============ CONFIGURATION ============
// Using the new Cloudinary credentials from .env
const NEW_CLOUDINARY = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
};

// Option 2: If you have local video files, put them in this directory
const LOCAL_VIDEOS_DIR = './migration-videos'; // Put your video files here

// Configure new Cloudinary
cloudinary.config(NEW_CLOUDINARY);

// ============ HELPER FUNCTIONS ============

async function downloadVideoFromUrl(url: string): Promise<Buffer | null> {
  try {
    console.log(`  📥 Attempting download from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`  ❌ Download failed: ${response.status} ${response.statusText}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    console.log(`  ❌ Download error: ${error.message}`);
    return null;
  }
}

async function uploadToNewCloudinary(buffer: Buffer, publicId: string): Promise<{ secure_url: string; thumbnail_url: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'campaigns',
        public_id: publicId,
      },
      (error, result) => {
        if (error) return reject(error);
        const thumbnail_url = result?.secure_url?.replace(/\.[^.]+$/, '.jpg') || '';
        resolve({
          secure_url: result!.secure_url,
          thumbnail_url,
        });
      }
    );

    const { Readable } = require('stream');
    Readable.from(buffer).pipe(uploadStream);
  });
}

async function findLocalVideoFile(slug: string): Promise<string | null> {
  if (!fs.existsSync(LOCAL_VIDEOS_DIR)) {
    return null;
  }

  // Try different extensions
  const extensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
  const possibleNames = [
    slug,
    `${slug}_full`,
    slug.replace(/%20/g, ' '),
    slug.replace(/ /g, '%20'),
  ];

  for (const name of possibleNames) {
    for (const ext of extensions) {
      const filePath = path.join(LOCAL_VIDEOS_DIR, name + ext);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
  }

  return null;
}

// ============ MAIN MIGRATION ============

async function migrateCampaign(campaign: any, dryRun: boolean = false) {
  console.log(`\n📹 Migrating: ${campaign.slug}`);
  console.log(`  Old video: ${campaign.fullVideoUrl}`);

  let videoBuffer: Buffer | null = null;

  // Strategy 1: Try to download from old URL (likely won't work with disabled account)
  videoBuffer = await downloadVideoFromUrl(campaign.fullVideoUrl);

  // Strategy 2: Look for local file
  if (!videoBuffer) {
    console.log(`  🔍 Looking for local file...`);
    const localFile = await findLocalVideoFile(campaign.slug);
    if (localFile) {
      console.log(`  ✅ Found local file: ${localFile}`);
      videoBuffer = fs.readFileSync(localFile);
    } else {
      console.log(`  ❌ No local file found for ${campaign.slug}`);
      console.log(`  💡 Place video file in: ${LOCAL_VIDEOS_DIR}/${campaign.slug}.mp4`);
      return { success: false, reason: 'No video source available' };
    }
  }

  if (!videoBuffer) {
    return { success: false, reason: 'Could not obtain video' };
  }

  if (dryRun) {
    console.log(`  🔍 DRY RUN: Would upload ${videoBuffer.length} bytes`);
    return { success: true, dryRun: true };
  }

  // Upload to new Cloudinary
  console.log(`  ☁️  Uploading to new Cloudinary...`);
  try {
    const { secure_url, thumbnail_url } = await uploadToNewCloudinary(videoBuffer, `${campaign.slug}_full`);
    console.log(`  ✅ Uploaded! New URL: ${secure_url}`);

    // Update database
    await CampaignModel.updateOne(
      { _id: campaign._id },
      {
        $set: {
          fullVideoUrl: secure_url,
          fullThumbnailUrl: thumbnail_url,
        },
      }
    );
    console.log(`  ✅ Database updated`);

    return {
      success: true,
      oldUrl: campaign.fullVideoUrl,
      newUrl: secure_url,
      newThumbnail: thumbnail_url,
    };
  } catch (error: any) {
    console.log(`  ❌ Upload failed: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const singleSlug = args.find(arg => !arg.startsWith('--'));

  console.log('🚀 Cloudinary Migration Script');
  console.log('================================\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Validate new Cloudinary config
  if (!NEW_CLOUDINARY.cloud_name || !NEW_CLOUDINARY.api_key || !NEW_CLOUDINARY.api_secret) {
    console.error('❌ New Cloudinary credentials not configured!');
    console.error('Add to .env file:');
    console.error('  NEW_CLOUDINARY_CLOUD_NAME=your_new_cloud_name');
    console.error('  NEW_CLOUDINARY_API_KEY=your_new_api_key');
    console.error('  NEW_CLOUDINARY_API_SECRET=your_new_api_secret');
    process.exit(1);
  }

  // Connect to MongoDB
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB\n');

  // Create local videos directory if it doesn't exist
  if (!fs.existsSync(LOCAL_VIDEOS_DIR)) {
    fs.mkdirSync(LOCAL_VIDEOS_DIR, { recursive: true });
    console.log(`📁 Created directory: ${LOCAL_VIDEOS_DIR}\n`);
  }

  // Fetch campaigns
  const query = singleSlug ? { slug: singleSlug } : {};
  const campaigns = await CampaignModel.find(query).lean();
  console.log(`📊 Found ${campaigns.length} campaign(s) to migrate\n`);

  if (campaigns.length === 0) {
    console.log('No campaigns found. Exiting.');
    process.exit(0);
  }

  // Migrate each campaign
  const results = {
    success: 0,
    failed: 0,
    details: [] as any[],
  };

  for (const campaign of campaigns) {
    const result = await migrateCampaign(campaign, dryRun);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }
    results.details.push({ slug: campaign.slug, ...result });

    // Add delay between uploads to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n\n================================');
  console.log('📊 MIGRATION SUMMARY');
  console.log('================================');
  console.log(`✅ Successful: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📋 Total: ${campaigns.length}`);

  if (results.failed > 0) {
    console.log('\n❌ Failed migrations:');
    results.details
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - ${r.slug}: ${r.reason}`);
      });
  }

  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}

// Run the script
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
