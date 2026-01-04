// src/services/googledrive.ts
import { google } from 'googleapis';
import { Readable } from 'stream';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

// OAuth2 client using your personal Google account
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Extract thumbnail from video using ffmpeg
async function extractThumbnail(videoBuffer: Buffer): Promise<Buffer> {
  const tempDir = os.tmpdir();
  const tempVideoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
  const tempThumbPath = path.join(tempDir, `thumb_${Date.now()}.jpg`);

  try {
    // Write video buffer to temp file
    fs.writeFileSync(tempVideoPath, videoBuffer);

    // Extract thumbnail at 1 second mark
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath as string, [
        '-i', tempVideoPath,
        '-ss', '00:00:01',      // Seek to 1 second
        '-vframes', '1',        // Extract 1 frame
        '-q:v', '2',            // High quality
        '-vf', 'scale=1280:-1', // Width 1280, maintain aspect ratio
        '-y',                   // Overwrite output
        tempThumbPath
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });

      ffmpeg.on('error', reject);
    });

    // Read thumbnail
    const thumbBuffer = fs.readFileSync(tempThumbPath);
    return thumbBuffer;
  } finally {
    // Cleanup temp files
    try { fs.unlinkSync(tempVideoPath); } catch {}
    try { fs.unlinkSync(tempThumbPath); } catch {}
  }
}

// Upload a file to Google Drive and make it public
async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [FOLDER_ID],
    },
    media: {
      mimeType,
      body: bufferToStream(buffer),
    },
    fields: 'id',
  });

  const fileId = response.data.id;
  if (!fileId) throw new Error('Failed to upload file');

  // Make file publicly accessible
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return fileId;
}

export const uploadVideo = async (
  buffer: Buffer,
  publicId?: string
): Promise<{ secure_url: string; thumbnail_url: string }> => {
  const baseName = publicId || `video_${Date.now()}`;

  // Upload video first (most important)
  console.log(`🚀 Uploading video to Google Drive...`);
  const videoFileId = await uploadFile(buffer, `${baseName}.mp4`, 'video/mp4');
  console.log(`✅ Video uploaded: ${videoFileId}`);

  // Try to extract and upload thumbnail
  let thumbnail_url = `https://via.placeholder.com/1280x720/333/fff?text=Video`;

  try {
    console.log(`🎬 Extracting thumbnail with ffmpeg...`);
    const thumbnailBuffer = await extractThumbnail(buffer);
    console.log(`✅ Thumbnail extracted (${(thumbnailBuffer.length / 1024).toFixed(1)} KB)`);

    console.log(`🖼️ Uploading thumbnail to Google Drive...`);
    const thumbFileId = await uploadFile(thumbnailBuffer, `${baseName}_thumb.jpg`, 'image/jpeg');
    console.log(`✅ Thumbnail uploaded: ${thumbFileId}`);

    thumbnail_url = `https://drive.google.com/uc?export=download&id=${thumbFileId}`;
  } catch (err) {
    console.error('⚠️ Thumbnail extraction failed, using placeholder:', (err as Error).message);
    // Continue with placeholder - don't fail the whole upload
  }

  // Generate video URL
  const secure_url = `https://drive.google.com/uc?export=download&id=${videoFileId}`;

  return {
    secure_url,
    thumbnail_url,
  };
};

export const deleteVideo = async (fileUrl: string): Promise<void> => {
  const match = fileUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (!match) return;

  const fileId = match[1];
  try {
    await drive.files.delete({ fileId });
    console.log(`🗑️ Deleted from Google Drive: ${fileId}`);
  } catch (err) {
    console.error('Failed to delete file:', err);
  }
};
