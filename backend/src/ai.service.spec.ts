import { AiService } from './ai.service';

describe('AiService retrieval grounding', () => {
  it('returns only published catalogue and project records plus vector-ranked knowledge', async () => {
    const prisma: any = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ content: 'Verified warranty: five years.', title: 'Warranty', source: 'owner' }]),
      catalogueProduct: { findMany: jest.fn().mockResolvedValue([{ id: 'product-1', name: 'Verified Sofa', sku: 'MFH-001', status: 'PUBLISHED', images: [] }]) },
      project: { findMany: jest.fn().mockResolvedValue([{ id: 'project-1', name: 'Verified Home', status: 'PUBLISHED', media: [], services: [] }]) },
    };
    const config: any = { get: jest.fn((key: string, fallback?: string) => key === 'OPENAI_API_KEY' ? 'test-key' : fallback) };
    const service = new AiService(prisma, config);
    jest.spyOn(service, 'embed').mockResolvedValue(Array(1536).fill(0.1));
    const result = await service.retrieve('sofa warranty');
    expect(result.knowledge[0].content).toContain('five years');
    expect(result.products[0].sku).toBe('MFH-001');
    expect(result.projects[0].id).toBe('project-1');
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('<=>'), expect.stringContaining('0.1'));
  });
});
