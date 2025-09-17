import { Router } from 'express';
import multer from 'multer';
import { adminAuth } from '../../middleware/admin-auth';
import {
  create,
  list,
  getBySlug,
  uploadCampaignAsync,   
  getUploadStatus,       
  listPublicLinks,
  remove,
  getMetaTags,
  update
} from './campaign.controller';
import { campaignCreateSchema } from './campaign.schema';
import { validateInput } from '../../middleware/input-validator';

const upload = multer({ storage: multer.memoryStorage() });
const campaignRouter = Router();

/* legacy JSON routes */
campaignRouter
  .route('/')
  .post(validateInput(campaignCreateSchema), adminAuth, create)
  .get(adminAuth, list);

/* ASYNC upload – memory → queue → 202 */
campaignRouter
  .route('/upload')
  .post(
    adminAuth,
    upload.fields([
      { name: 'preview', maxCount: 1 },
      { name: 'full', maxCount: 1 },
    ]),
    uploadCampaignAsync          // ← swapped
  );

/* status polling */
campaignRouter.get('/upload-status/:jobId', getUploadStatus);

/* UPDATE (keep unchanged) */
campaignRouter
  .route('/:slug')
  .put(
    adminAuth,
    upload.fields([
      { name: 'preview', maxCount: 1 },
      { name: 'full', maxCount: 1 },
    ]),
    update
  );

/* public routes (keep unchanged) */
campaignRouter.get('/:slug', getBySlug);
campaignRouter.get('/:slug/meta', getMetaTags);
campaignRouter.get('/public/links', listPublicLinks);
campaignRouter.delete('/:slug', adminAuth, remove);

export default campaignRouter;