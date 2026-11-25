import * as bcrypt from 'bcryptjs';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('authenticates against the stored password hash and never accepts a frontend role', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1', email: 'user@example.com', passwordHash, role: 'CUSTOMER' }) }, session: { create: jest.fn().mockResolvedValue({ id: 's1' }), update: jest.fn() } } as any;
    const jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') } as any;
    const config = { get: jest.fn().mockReturnValue('15m'), getOrThrow: jest.fn().mockReturnValue('secret') } as any;
    const result = await new AuthController(prisma, jwt, config).login({ email: 'USER@EXAMPLE.COM', password: 'correct-password' });
    expect(result.role).toBe('CUSTOMER');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
  });
});
