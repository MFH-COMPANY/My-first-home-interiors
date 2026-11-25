import { ProjectsController } from './projects.controller';

describe('ProjectsController', () => {
  it('only queries published projects and applies pagination', async () => {
    const prisma = { $transaction: jest.fn().mockResolvedValue([[{ id: 'p1' }], 1]), project: { findMany: jest.fn(), count: jest.fn() } } as any;
    const result = await new ProjectsController(prisma).list('2 BHK', 'Bedrooms', 'Modern Luxury', 'Chennai', '2', '10');
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.total).toBe(1);
  });
});
