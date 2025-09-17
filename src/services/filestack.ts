// src/services/filestack.ts
import https from 'https';
import { basename, dirname } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { v2 as cloudinary } from 'cloudinary';
import { tmpNameSync } from 'tmp';
import { writeFileSync, unlinkSync, readFileSync } from 'fs';

ffmpeg.setFfmpegPath(ffmpegStatic as string);

const API_KEY = process.env.FILESTACK_API_KEY!;

/* ---- export ONE frame as JPG (file-based) ---- */
async function extractFrame(original: Buffer): Promise<Buffer> {
  const inFile  = tmpNameSync({ postfix: '.mp4' });
  const outFile = tmpNameSync({ postfix: '.jpg' });
  writeFileSync(inFile, original);

  return new Promise((resolve, reject) => {
    ffmpeg(inFile)
      .screenshots({
        timestamps: ['1'],           // 1-second mark
        filename: basename(outFile),
        folder: dirname(outFile),
        size: '640x?',               // optional: cap width
      })
      .on('error', (err) => {
        unlinkSync(inFile);
        reject(err);
      })
      .on('end', () => {
        const jpg = readFileSync(outFile);
        unlinkSync(inFile);
        unlinkSync(outFile);
        resolve(jpg);
      });
  });
}

export async function uploadToFilestack(
  buffer: Buffer,
  publicId: string
): Promise<{ secure_url: string; thumbnail_url: string }> {
  const filename = basename(publicId) + '.mp4';

  /* 1. big video → Filestack (unchanged) */
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

  /* 2. single JPG frame → Cloudinary */
  const frame = await extractFrame(buffer);
  const thumb = await new Promise<{ secure_url: string }>((res, rej) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'campaigns', public_id: `${publicId}_thumb` },
      (err, result) => (err ? rej(err) : res(result!))
    );
    stream.end(frame);
  });

  return {
    secure_url: filestackUrl,
    thumbnail_url: thumb.secure_url,
  };
}