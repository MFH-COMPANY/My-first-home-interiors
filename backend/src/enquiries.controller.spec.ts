import { EnquiriesController } from './enquiries.controller';

describe('EnquiriesController', () => {
  it('persists a normalized email through Prisma', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'e1', name: 'A', createdAt: new Date() });
    const result = await new EnquiriesController({ enquiry: { create } } as any).create({ name: 'A', email: 'A@EXAMPLE.COM', message: 'A sufficiently detailed enquiry.' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ email: 'a@example.com' }) }));
    expect(result.id).toBe('e1');
  });
});
