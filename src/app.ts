import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import { VideoWorker } from './modules/campaign/campaign.worker'; // NEW
import adminRouter from './modules/admin/admin.router';
import campaignRouter from './modules/campaign/campaign.router';

export const createApp = async () => {
  await connectDB();

  // ---------- START BACKGROUND WORKER ----------
  VideoWorker.run();
  // ---------------------------------------------

  const app = express();

  app.use(cors({ 
    origin: ['http://localhost:4200', 'https://bzfront.vercel.app'],
    credentials: true 
  }));
  app.use(express.json());

  app.use('/admin', adminRouter);
  app.use('/campaigns', campaignRouter);

  return app;
};