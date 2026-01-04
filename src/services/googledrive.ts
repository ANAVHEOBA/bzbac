// src/services/googledrive.ts
import { google } from 'googleapis';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

// OAuth2 client using your personal Google account
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Set refresh token - this lets us upload to YOUR Drive (15GB free)
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

export const uploadVideo = async (
  buffer: Buffer,
  publicId?: string
): Promise<{ secure_url: string; thumbnail_url: string }> => {
  const fileName = publicId ? `${publicId}.mp4` : `video_${Date.now()}.mp4`;

  // Upload file to Google Drive (YOUR account's storage)
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
  const secure_url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const thumbnail_url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1280`;

  console.log(`✅ Uploaded to Google Drive: ${fileName} (${fileId})`);

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
