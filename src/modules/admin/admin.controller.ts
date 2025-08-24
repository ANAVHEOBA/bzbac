import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createAdmin, findAdminByEmail } from './admin.crud';
import { adminLoginSchema, adminRegisterSchema } from './admin.schema';

const { JWT_SECRET = 'fallback' } = process.env;

/* ---------- LOGIN ----------- */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = adminLoginSchema.parse(req.body);
    const admin = await findAdminByEmail(email);

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token });
  } catch (err: any) {
    res.status(400).json({ message: err.errors?.[0]?.message || err.message });
  }
};

/* ---------- REGISTER -------- */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = adminRegisterSchema.parse(req.body);

    if (await findAdminByEmail(email)) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const admin = await createAdmin(email, password);
    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ token });
  } catch (err: any) {
    res.status(400).json({ message: err.errors?.[0]?.message || err.message });
  }
};

/* ---------- ME -------------- */
export const me = (req: Request, res: Response) => {
  // assumes an auth middleware has attached req.admin
  res.json(req.admin);
};