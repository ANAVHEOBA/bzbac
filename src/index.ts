// src/index.ts
import dotenv from 'dotenv';
import { createApp } from './app';
import './cron';          // ← ADD THIS LINE

dotenv.config();

(async () => {
  const app = await createApp();
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server running on :${port}`));
})();