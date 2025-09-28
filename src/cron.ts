import cron from 'node-cron';
import crypto from 'crypto';

const HOOK = 'https://api.vercel.com/v1/integrations/deploy/prj_xdroPRMpdOhJkq0JV4DZhrK63TGv/I5vjp0CggU';
const API  = 'https://bzbac.onrender.com/campaigns/public/links';

let lastHash = '';

async function check() {
  try {
    const res  = await fetch(API, { method: 'HEAD' }); // lightweight
    const etag = res.headers.get('etag') ?? '';
    if (etag === lastHash) return;                   // no change
    lastHash = etag;

    // double-check slugs (optional, keeps order stable)
    const list = await fetch(API).then(r => r.json()) as Array<{slug:string}>;
    const hash = crypto.createHash('md5')
                       .update(list.map(c => c.slug).sort().join(','))
                       .digest('hex');
    if (hash === lastHash) return;                   // still identical
    lastHash = hash;

    await fetch(HOOK, { method: 'POST' });
    console.log('[cron] new campaign detected → rebuild triggered');
  } catch (e) { console.error('[cron]', e); }
}

// every 2 min is plenty; HEAD + hash keeps load tiny
cron.schedule('*/2 * * * *', check);
console.log('[cron] started (etag + hash check)');