import { BadRequestException } from '@nestjs/common';
import { BookingsController } from './bookings.controller';

describe('BookingsController', () => {
  it('rejects a confirmed-time conflict before creating a booking', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'existing' });
    const create = jest.fn();
    const prisma = { $transaction: jest.fn(async (callback: any) => callback({ consultationBooking: { findFirst, create } })) } as any;
    const controller = new BookingsController(prisma);
    await expect(controller.create({ name: 'A Customer', email: 'A@EXAMPLE.COM', phone: '9999999999', preferredAt: new Date(Date.now() + 86_400_000).toISOString() }, undefined)).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('normalizes email and persists a requested booking', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'b1' });
    const prisma = { $transaction: jest.fn(async (callback: any) => callback({ consultationBooking: { findFirst: jest.fn().mockResolvedValue(null), create } })) } as any;
    await new BookingsController(prisma).create({ name: 'A Customer', email: 'A@EXAMPLE.COM', phone: '9999999999', preferredAt: new Date(Date.now() + 86_400_000).toISOString() }, { id: 'u1' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ email: 'a@example.com', userId: 'u1', status: 'REQUESTED' }) }));
  });
});
