// src/modules/admin/admin.router.ts
import { Router } from 'express';
import { login, register, me } from './admin.controller';
import { adminAuth } from '../../middleware/admin-auth'; // we’ll create next

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', adminAuth, me);   // protected

export default router;