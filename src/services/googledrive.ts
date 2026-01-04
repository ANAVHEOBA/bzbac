// src/services/googledrive.ts
import { google } from 'googleapis';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
const API_KEY = process.env.GOOGLE_API_KEY || '';

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export const uploadVideo = async (
  buffer: Buffer,
  publicId?: string
): Promise<{ secure_url: string; thumbnail_url: string }> => {
  const fileName = publicId ? `${publicId}.mp4` : `video_${Date.now()}.mp4`;

  // Upload file to Google Drive
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [FOLDER_ID],
    },
    media: {
      mimeType: 'video/mp4',
      body: bufferToStream(buffer),
    },
    fields: 'id, name, webContentLink, webViewLink',
  });

  const fileId = response.data.id;
  if (!fileId) {
    throw new Error('Failed to upload file to Google Drive');
  }

  // Make file publicly accessible
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  // Generate direct URLs
  // Direct download/streaming URL
  const secure_url = `https://drive.google.com/uc?export=download&id=${fileId}`;

  // Thumbnail URL (Google Drive auto-generates thumbnails for videos)
  const thumbnail_url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1280`;

  console.log(`✅ Uploaded to Google Drive: ${fileName} (${fileId})`);

  return {
    secure_url,
    thumbnail_url,
  };
};

export const deleteVideo = async (fileUrl: string): Promise<void> => {
  // Extract file ID from URL
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
