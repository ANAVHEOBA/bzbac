#!/usr/bin/env node
require('dotenv').config();   // loads .env or shell env
const mongoose = require('mongoose');

// ------------------------------------------------------------------
// Inline campaign model (identical to your app schema)
// ------------------------------------------------------------------
const campaignSchema = new mongoose.Schema({
  slug:            { type: String, required: true, unique: true },
  snapVideoUrl:    { type: String, required: true },
  fullVideoUrl:    { type: String, required: true },
  snapThumbnailUrl: String,
  fullThumbnailUrl: String,
  waLink:          { type: String, required: true },
  caption:         String
}, { timestamps: true });

const CampaignModel = mongoose.model('Campaign', campaignSchema);

// ------------------------------------------------------------------
// Main work
// ------------------------------------------------------------------
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡  MongoDB connected');

    const bulkOps = [];

    const campaigns = await CampaignModel.find({
      $or: [
        { snapThumbnailUrl: { $exists: false } },
        { fullThumbnailUrl: { $exists: false } }
      ]
    });

    campaigns.forEach(c => {
      const snapThumbnailUrl = c.snapVideoUrl.replace(/\.[^.]+$/, '.jpg');
      const fullThumbnailUrl = c.fullVideoUrl.replace(/\.[^.]+$/, '.jpg');

      bulkOps.push({
        updateOne: {
          filter: { _id: c._id },
          update: {
            $set: { snapThumbnailUrl, fullThumbnailUrl }
          }
        }
      });
    });

    if (!bulkOps.length) {
      console.log('✅  Nothing to update');
      return;
    }

    const res = await CampaignModel.bulkWrite(bulkOps);
    console.log(`✅  Updated ${res.modifiedCount} campaigns`);
  } catch (err) {
    console.error('❌  Error:', err);
  } finally {
    await mongoose.disconnect();
  }
})();