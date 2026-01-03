// src/services/imagekit.ts
import ImageKit from 'imagekit';
import dotenv from 'dotenv';

dotenv.config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

export const uploadVideo = (buffer: Buffer, publicId?: string): Promise<{ secure_url: string; thumbnail_url: string }> => {
  return new Promise((resolve, reject) => {
    imagekit.upload(
      {
        file: buffer,
        fileName: publicId ? `${publicId}.mp4` : `video_${Date.now()}.mp4`,
        folder: '/campaigns',
        useUniqueFileName: false,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('No result from ImageKit'));
        }

        // ImageKit generates thumbnails automatically for videos
        // Append /ik-thumbnail.jpg after the video URL to get thumbnail
        // Example: https://ik.imagekit.io/xxx/video.mp4/ik-thumbnail.jpg
        const videoUrl = result.url;
        const thumbnailUrl = `${videoUrl}/ik-thumbnail.jpg`;

        resolve({
          secure_url: videoUrl,
          thumbnail_url: thumbnailUrl,
        });
      }
    );
  });
};
