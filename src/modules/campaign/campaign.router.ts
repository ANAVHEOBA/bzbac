import { Router } from 'express';
import multer from 'multer';
import { adminAuth } from '../../middleware/admin-auth';
import {
  create,
  list,
  getBySlug,
  uploadCampaign,
  listPublicLinks,
  remove
} from './campaign.controller';
import { campaignCreateSchema } from './campaign.schema';
import { validateInput } from '../../middleware/input-validator';

const upload = multer({ storage: multer.memoryStorage() });
const campaignRouter = Router();

/* legacy JSON routes */
campaignRouter
  .route('/')
  .post(
    validateInput(campaignCreateSchema),
    adminAuth,
    create
  )
  .get(adminAuth, list);

/* single-shot upload (+campaign) */
campaignRouter
  .route('/upload')
  .post(
    adminAuth,
    upload.fields([
      { name: 'preview', maxCount: 1 },
      { name: 'full', maxCount: 1 },
    ]),
    uploadCampaign
  );

/* public landing page */
campaignRouter.get('/:slug', getBySlug);


campaignRouter.get('/public/links', listPublicLinks);


campaignRouter.delete('/:slug', adminAuth, remove);

export default campaignRouter;