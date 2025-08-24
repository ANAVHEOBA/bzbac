// src/middleware/admin-auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findAdminById } from '../modules/admin/admin.crud';

interface AdminJwtPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: any; // or the actual Admin type
    }
  }
}

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AdminJwtPayload;
    const admin = await findAdminById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};