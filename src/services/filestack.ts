// src/services/filestack.ts
import https from 'https';
import { basename } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

ffmpeg.setFfmpegPath(ffmpegStatic as string);

const API_KEY = process.env.FILESTACK_API_KEY!;

/* ---- helper: 5-second clip → buffer ---- */
async function snip5sec(original: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const writable = ffmpeg()
      .input(Readable.from(original))
      .inputOptions(['-t 5'])
      .outputFormat('mp4')
      .videoCodec('copy')
      .audioCodec('copy')
      .on('error', reject)
      .on('end', () => resolve(Buffer.concat(chunks)))
      .pipe(); // returns Writable

    writable.on('data', (c: Buffer) => chunks.push(c));
  });
}

export async function uploadToFilestack(
  buffer: Buffer,
  publicId: string
): Promise<{ secure_url: string; thumbnail_url: string }> {
  const filename = basename(publicId) + '.mp4';

  /* 1. big video → Filestack */
  const filestackUrl = await new Promise<string>((resolve, reject) => {
    const opts: https.RequestOptions = {
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
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () =>
        res.statusCode === 200
          ? resolve(JSON.parse(body).url)
          : reject(new Error(`Filestack ${res.statusCode} – ${body}`))
      );
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });

  /* 2. 5-second clip → Cloudinary (thumbnail only) */
  const clip = await snip5sec(buffer);
  const thumb = await new Promise<{ secure_url: string }>((res, rej) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'campaigns',
        public_id: `${publicId}_thumb`,
        format: 'jpg',
        start_offset: '2',
      },
      (err, result) => (err ? rej(err) : res(result!))
    );
    stream.end(clip);
  });

  return {
    secure_url: filestackUrl,
    thumbnail_url: thumb.secure_url,
  };
}