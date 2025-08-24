// src/services/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadVideo = (buffer: Buffer, publicId?: string) =>
  new Promise<{ secure_url: string; thumbnail_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'video', folder: 'campaigns', public_id: publicId },
      (err, result) => {
        if (err) return reject(err);
        const thumbnail_url = result?.secure_url?.replace(/\.[^.]+$/, '.jpg') || '';
        resolve({ secure_url: result!.secure_url, thumbnail_url });
      }
    );
    Readable.from(buffer).pipe(stream);
  });