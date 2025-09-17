// src/services/filestack.ts
import https from 'https';
import { basename } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

ffmpeg.setFfmpegPath(ffmpegStatic as string);

const API_KEY = process.env.FILESTACK_API_KEY!;

/* ---- helper: first 2 s → buffer (no audio, web-safe) ---- */
async function snip2sec(original: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    ffmpeg()
      .input(Readable.from(original))
      .inputOptions(['-t 2']) // first 2 s
      .outputFormat('mp4')
      .videoCodec('libx264')
      .audioCodec('aac') // keep tiny audio
      .outputOptions(['-movflags frag_keyframe+empty_moov']) // fast pipe
      .on('error', reject)
      .on('end', () => resolve(Buffer.concat(chunks)))
      .pipe()
      .on('data', (c: Buffer) => chunks.push(c));
  });
}

export async function uploadToFilestack(
  buffer: Buffer,
  publicId: string
): Promise<{ secure_url: string; thumbnail_url: string }> {
  const filename = basename(publicId) + '.mp4';

  /* 1. big video → Filestack (no change) */
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

  /* 2. tiny 2-s clip → Cloudinary (thumbnail only) */
  const clip = await snip2sec(buffer);
  const thumb = await new Promise<{ secure_url: string }>((res, rej) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'campaigns',
        public_id: `${publicId}_thumb`,
        format: 'jpg',
        start_offset: '1',
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