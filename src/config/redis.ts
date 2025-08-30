import Redis from 'ioredis';

const redis = new Redis(
  process.env.REDIS_URL || 'redis://default:FvmCo819hXAKscmmpvjKM7gWDCcRNDgS@redis-16421.c239.us-east-1-2.ec2.redns.redis-cloud.com:16421'
);

redis.on('error', (e) => console.error('❌  Redis error', e));
redis.on('connect', () => console.log('✅  Redis connected'));

export { redis };