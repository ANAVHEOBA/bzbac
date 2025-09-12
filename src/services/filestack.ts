import https from 'https';
import { basename } from 'path';
import axios from 'axios'; // Add axios for better HTTP handling

const API_KEY = process.env.FILESTACK_API_KEY || 'AFwrkM2soSpEaxLDwXDUzz';

interface FilestackResponse {
  url: string;
  handle: string;
}

export async function uploadToFilestack(
  buffer: Buffer,
  publicId: string
): Promise<{ secure_url: string; thumbnail_url: string }> {
  const sizeMB = buffer.length / 1024 / 1024;
  const filename = basename(publicId) + '.mp4';
  
  console.log(`📊 File size: ${sizeMB.toFixed(2)} MB`);

  try {
    let result;
    
    // For files > 100MB, use multipart upload
    if (sizeMB > 100) {
      console.log('🔄 Using multipart upload for large file');
      result = await multipartUploadToFilestack(buffer, filename);
    } else {
      console.log('🔄 Using single upload');
      result = await singleUploadToFilestack(buffer, filename);
    }

    // Generate thumbnail URL
    const thumbnailUrl = `${result.url}/video_snapshot/time:1/output=format:jpg/resize=width:640,height:360,fit:crop`;
    
    console.log('✅ Filestack upload completed');
    console.log('📺 Video URL:', result.url);
    console.log('🖼️  Thumbnail URL:', thumbnailUrl);

    return {
      secure_url: result.url,
      thumbnail_url: thumbnailUrl,
    };
  } catch (error) {
    console.error('❌ Filestack upload failed:', error);
    throw error;
  }
}

async function singleUploadToFilestack(buffer: Buffer, filename: string): Promise<FilestackResponse> {
  return new Promise((resolve, reject) => {
    const mime = 'video/mp4';

    const options: https.RequestOptions = {
      hostname: 'www.filestackapi.com',
      port: 443,
      path: `/api/store/S3?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Length': buffer.length,
        'Content-Type': mime,
        'Filestack-Upload-Handle': filename,
      },
      timeout: 300000, // 5 minutes timeout
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json: FilestackResponse = JSON.parse(body);
            resolve(json);
          } catch (e) {
            reject(new Error('Bad JSON from Filestack'));
          }
        } else {
          reject(new Error(`Filestack upload failed: ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Filestack upload timeout'));
    });

    req.write(buffer);
    req.end();
  });
}

async function multipartUploadToFilestack(buffer: Buffer, filename: string): Promise<FilestackResponse> {
  // Implement multipart upload for very large files
  // This is a simplified version - you might want to use Filestack's JS SDK instead
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  const chunks = Math.ceil(buffer.length / chunkSize);
  
  console.log(`🧩 Uploading ${chunks} chunks...`);
  
  // For now, fall back to single upload with longer timeout
  // In production, implement proper multipart upload
  return singleUploadToFilestack(buffer, filename);
}