// src/modules/admin/admin.schema.ts
import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().pipe(z.email()),
  password: z.string().min(6),
});

export const adminRegisterSchema = adminLoginSchema;