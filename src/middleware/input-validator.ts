// src/middleware/input-validator.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateInput =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.issues[0]?.message || 'Invalid input' });
      }
      next(err);
    }
  };