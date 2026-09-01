import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { signInUser } from './auth.service.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a safe user payload when credentials are valid', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      passwordHash: 'hashed-password',
      createdAt: new Date(),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true);

    await expect(signInUser('alice@example.com', 'secret123')).resolves.toEqual({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
    });
  });
});
