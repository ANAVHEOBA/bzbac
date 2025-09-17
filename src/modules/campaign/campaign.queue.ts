import { Queue } from 'bullmq';
import { bullRedisConn } from '../../config/redis-bullmq'; // <-- fixed import

export const videoQueue = new Queue('video', {
  connection: bullRedisConn, // <-- uses the dedicated BullMQ conn
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 10,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
});