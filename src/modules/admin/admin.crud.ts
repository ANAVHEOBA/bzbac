import { AdminModel } from './admin.model';
import bcrypt from 'bcryptjs';

/* ---------- CREATE ---------- */
export const createAdmin = async (email: string, plainPassword: string) => {
  const passwordHash = await bcrypt.hash(plainPassword, 12);
  return AdminModel.create({ email, passwordHash });
};

/* ---------- READ ------------ */
export const findAdminByEmail = async (email: string) =>
  AdminModel.findOne({ email });

/* ---------- SEED ------------ */
export const seedDefaultAdmin = async () => {
  const email = 'bezaleeldennis@gmail.com';
  const password = 'bzassetar';

  const exists = await findAdminByEmail(email);
  if (!exists) {
    await createAdmin(email, password);
    console.log('[Admin] Default admin seeded');
  }
};


export const findAdminById = async (id: string) =>
    AdminModel.findById(id);