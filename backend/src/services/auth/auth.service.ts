import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';

export async function signInUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new Error('Invalid email or password');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
