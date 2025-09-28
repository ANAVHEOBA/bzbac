import cron from 'node-cron';
import crypto from 'crypto';
import fetch from 'node-fetch';

const HOOK = 'https://api.vercel.com/v1/integrations/deploy/prj_xdroPRMpdOhJkq0JV4DZhrK63TGv/I5vjp0CggU';
const API  = 'https://bzbac.onrender.com/campaigns/public/links';

let lastHash = '';

async function check() {
  try {
    const res  = await fetch(API, { method: 'HEAD' });
    const etag = res.headers.get('etag') ?? '';
    if (etag === lastHash) return;
    lastHash = etag;

    const list = await fetch(API).then(r => r.json()) as Array<{slug:string}>;
    const hash = crypto.createHash('md5')
                       .update(list.map(c => c.slug).sort().join(','))
                       .digest('hex');
    if (hash === lastHash) return;
    lastHash = hash;

    await fetch(HOOK, { method: 'POST' });
    console.log('[cron] new campaign detected → rebuild triggered');
  } catch (e) { console.error('[cron]', e); }
}

// once per hour (00:00, 01:00 …)
cron.schedule('0 * * * *', check);
console.log('[cron] hourly safety-net started');