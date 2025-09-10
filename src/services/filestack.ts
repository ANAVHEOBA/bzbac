import https from 'https';
import { basename } from 'path';

const API_KEY = process.env.FILESTACK_API_KEY || 'AFwrkM2soSpEaxLDwXDUzz';

interface FilestackResponse {
  url: string;
  handle: string;
}

export async function uploadToFilestack(
  buffer: Buffer,
  publicId: string
): Promise<{ secure_url: string; thumbnail_url: string }> {
  return new Promise((resolve, reject) => {
    const mime = 'video/mp4'; // or sniff from buffer if you care
    const filename = basename(publicId) + '.mp4';

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
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json: FilestackResponse = JSON.parse(body);
            resolve({
              secure_url: json.url,
              thumbnail_url: `${json.url}/thumbnail`, // on-the-fly thumb
            });
          } catch (e) {
            reject(new Error('Bad JSON from Filestack'));
          }
        } else {
          reject(new Error(`Filestack upload failed: ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}