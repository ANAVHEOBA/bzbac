// src/config/db.ts
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

export const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('MongoDB connected');
};