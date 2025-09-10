/**
 * Back-end upload to Filestack with % progress  (WebM screencast)
 * Node ≥ 14
 */
const fs   = require('fs');
const path = require('path');
const https = require('https');

/* ---------- CONFIG ---------- */
const API_KEY = 'AFwrkM2soSpEaxLDwXDUzz';
const FILE    = path.resolve(__dirname,
  'Screencast from 2025-08-22 10-05-54.webm');
/* ----------------------------- */

const stats   = fs.statSync(FILE);
const size    = stats.size;
let uploaded  = 0;
let lastPct   = -1;

const FILENAME = 'Screencast-2025-08-22.webm';
const MIME     = 'video/webm';

const options = {
  hostname: 'www.filestackapi.com',
  port: 443,
  path: `/api/store/S3?key=${API_KEY}`,
  method: 'POST',
  headers: {
    'Content-Length': size,
    'Content-Type': MIME,
    'Filestack-Upload-Handle': FILENAME,
  },
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const json = JSON.parse(body);
      const handle = json.url.split('/').pop();
      console.log('\nUpload OK – URL :', json.url);
      console.log('Handle          :', handle);
      console.log('Stream URL      : https://cdn.filestackcontent.com/' + handle);
    } else {
      console.error('\nUpload failed:', res.statusCode, body);
    }
  });
});

req.on('error', e => console.error('\nRequest error:', e));

// progress tracker
const read = fs.createReadStream(FILE);
read.on('data', chunk => {
  uploaded += chunk.length;
  const pct = Math.round((uploaded / size) * 100);
  if (pct !== lastPct) {
    process.stdout.write(`\rUploading… ${pct}%`);
    lastPct = pct;
  }
});
read.on('end', () => process.stdout.write('\n'));
read.pipe(req);