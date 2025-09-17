import IORedis, { RedisOptions } from 'ioredis'; // ← grab the interface here

/* ----------  connection options  ---------- */
const bullOpts: RedisOptions = {                 // ← use the imported interface
  maxRetriesPerRequest: null, // BullMQ requirement
};

/* ----------  primary connection  ---------- */
const bullRedisConn = new IORedis(
  process.env.REDIS_URL ??
    'redis://default:FvmCo819hXAKscmmpvjKM7gWDCcRNDgS@redis-16421.c239.us-east-1-2.ec2.redns.redis-cloud.com:16421',
  bullOpts,
);

/* ----------  exports  ---------- */
export { bullRedisConn };                           // for Queues
export const bullRedisDuplicate = bullRedisConn.duplicate(); // for Workers