import { Router } from 'express';
import multer from 'multer';
import { adminAuth } from '../../middleware/admin-auth';
import {
  create,
  list,
  getBySlug,
  uploadCampaign,
  listPublicLinks,
  remove,
  getMetaTags,
  update,
  getShareLinks,
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

/* single-shot upload */
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

/* public links list - MUST be before /:slug */
campaignRouter.get('/public/links', listPublicLinks);

/* meta tags page - MUST be before /:slug */
campaignRouter.get('/:slug/meta', getMetaTags);

/* share links generator - MUST be before /:slug */
campaignRouter.get('/:slug/share-links', getShareLinks);

/* update campaign */
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

/* public landing page - catch-all for /:slug */
campaignRouter.get('/:slug', getBySlug);

/* delete campaign */
campaignRouter.delete('/:slug', adminAuth, remove);

export default campaignRouter;
