import { Worker } from 'bullmq';
import { bullRedisDuplicate } from '../../config/redis-bullmq'; // <-- fixed import
import { uploadSingleVideo } from './campaign.controller';
import { createCampaign } from './campaign.crud';

export class VideoWorker {
  private static instance: Worker;

  static run(): void {
    if (this.instance) return;

    this.instance = new Worker(
      'video',
      async (job) => {
        const {
          bufferB64,
          slug,
          caption,
          waLink,
          waButtonLabel,
          popupTriggerType,
          popupTriggerValue,
        } = job.data;

        const buffer = Buffer.from(bufferB64, 'base64');
        const { secure_url, thumbnail_url } = await uploadSingleVideo(
          buffer,
          `${slug}_full`,
        );

        await createCampaign({
          slug,
          fullVideoUrl: secure_url,
          fullThumbnailUrl: thumbnail_url,
          waLink,
          waButtonLabel,
          caption,
          popupTriggerType,
          popupTriggerValue,
        });

        return { secure_url, thumbnail_url };
      },
      { connection: bullRedisDuplicate, concurrency: 2 },
    );

    this.instance.on('completed', (job) => {
      if (job) console.log(`✅ job ${job.id} completed`);
    });

    this.instance.on('failed', (job, err) => {
      if (job) console.error(`❌ job ${job.id} failed`, err);
    });
  }
}