#!/usr/bin/env node
/* gdriveSimple.js – upload + public link – loads SA from json file */
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { google } = require('googleapis');

const FOLDER_ID = process.env.GOOGLE_FOLDER_ID || undefined;
const KEY_FILE  = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './gdrive-key.json';

if (!fs.existsSync(KEY_FILE)) {
  console.error('❌ Service-account key file not found:', KEY_FILE);
  process.exit(1);
}

let sa;
try {
  sa = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
} catch (err) {
  console.error('❌ Failed to parse service account key JSON:', err.message);
  process.exit(1);
}

async function getDrive() {
  const jwt = new google.auth.JWT(
    sa.client_email,
    null,
    sa.private_key,
    [
      'https://www.googleapis.com/auth/drive.file',       // ✅ FIXED: NO TRAILING SPACES
      'https://www.googleapis.com/auth/drive.readonly'    // ✅ FIXED: NO TRAILING SPACES
    ],
    null
  );

  try {
    await jwt.authorize();
  } catch (err) {
    console.error('❌ JWT Authorization failed. Check your key and scopes.');
    console.error('💡 Common cause: trailing spaces in scope URLs or invalid key.');
    throw err;
  }

  return google.drive({ version: 'v3', auth: jwt });
}

async function uploadVideo(filePath) {
  const drive = await getDrive();
  const fileName = path.basename(filePath);

  const fileMetadata = { name: fileName, parents: FOLDER_ID ? [FOLDER_ID] : [] };
  const media = { mimeType: 'video/webm', body: fs.createReadStream(filePath) }; // ✅ Changed to webm

  const res = await drive.files.create({ requestBody: fileMetadata, media, fields: 'id' });
  const fileId = res.data.id;

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' }
  });

  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  console.log('\n✅ Uploaded & public:\n' + url + '\n');
  return url;
}

if (require.main === module) {
  const target = process.argv[2];
  if (!target || !fs.existsSync(target)) {
    console.error('Usage: node gdriveSimple.js <video-file>');
    process.exit(1);
  }
  uploadVideo(path.resolve(target)).catch(console.error);
}

module.exports = { uploadVideo };