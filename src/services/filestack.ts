// src/services/filestack.ts
import https from 'https';
import { basename } from 'path';
import { v2 as cloudinary } from 'cloudinary';

const API_KEY = process.env.FILESTACK_API_KEY!;

export async function uploadToFilestack(
  buffer: Buffer,
  publicId: string
): Promise<{ secure_url: string; thumbnail_url: string }> {
  const filename = basename(publicId) + '.mp4';

  /* 1. push bytes to Filestack … */
  const filestackUrl = await new Promise<string>((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: 'www.filestackapi.com',
      port: 443,
      path: `/api/store/S3?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Length': buffer.length,
        'Content-Type': 'video/mp4',
        'Filestack-Upload-Handle': filename,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body).url);
        } else {
          reject(new Error(`Filestack ${res.statusCode} – ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });

  /* 2. let Cloudinary create a JPG poster from the public video URL */
  const cloudinaryThumb = await cloudinary.uploader.upload(filestackUrl, {
    resource_type: 'image',          // ← KEY FIX: ask for an *image*
    folder: 'campaigns',
    public_id: `${publicId}_thumb`,
    format: 'jpg',                   // force JPG output
    start_offset: '2',               // frame at 2 s
  });

  return {
    secure_url: filestackUrl,                    // >70 MB video on Filestack
    thumbnail_url: cloudinaryThumb.secure_url,   // Cloudinary-generated thumbnail
  };
}