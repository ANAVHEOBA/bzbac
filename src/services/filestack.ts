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

  /* 1. upload full video to Filestack */
  const filestackUrl = await new Promise<string>((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'www.filestackapi.com',
        port: 443,
        path: `/api/store/S3?key=${API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Length': buffer.length,
          'Content-Type': 'video/mp4',
          'Filestack-Upload-Handle': filename,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () =>
          res.statusCode === 200
            ? resolve(JSON.parse(body).url)
            : reject(new Error(`Filestack ${res.statusCode} – ${body}`))
        );
      }
    );
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });

  /* 2. ask Cloudinary to fetch the *public* video and create one JPG poster */
  const thumb = await cloudinary.uploader.upload(filestackUrl, {
    resource_type: 'image',   // we want an image back
    folder: 'campaigns',
    public_id: `${publicId}_thumb`,
    format: 'jpg',
    start_offset: '2',        // frame at 2 s
  });

  return {
    secure_url: filestackUrl,
    thumbnail_url: thumb.secure_url,
  };
}