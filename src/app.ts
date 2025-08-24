import express from 'express';
import cors from 'cors';                // ← add
import { connectDB } from './config/db';
import adminRouter from './modules/admin/admin.router';
import campaignRouter from './modules/campaign/campaign.router';

export const createApp = async () => {
  await connectDB();

  const app = express();

  // allow all origins in dev; tighten for prod
  app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
  app.use(express.json());

  app.use('/admin', adminRouter);
  app.use('/campaigns', campaignRouter);

  return app;
};