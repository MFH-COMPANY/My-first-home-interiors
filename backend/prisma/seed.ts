import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const categories = ['Sofas','Beds','Wardrobes','TV units','Dining tables','Modular kitchens','Storage furniture','Wood','Plywood','Laminates','Acrylic finishes','Marble','Tiles','Wallpapers','Glass','Fabrics','Metal finishes','Ceiling lights','Pendant lights','Chandeliers','LED lighting','Wall lights','Wall finishes','Flooring','Ceiling designs','Decorative finishes'];

async function main() {
  for (const name of categories) await prisma.catalogueCategory.upsert({ where: { name }, update: {}, create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') } });
  const furniture = await prisma.catalogueCategory.findUniqueOrThrow({ where: { name: 'Sofas' } });
  await prisma.catalogueProduct.upsert({ where: { sku: 'SAMPLE-VERIFY-001' }, update: {}, create: { categoryId: furniture.id, name: 'SAMPLE — Owner verification required', sku: 'SAMPLE-VERIFY-001', description: 'Placeholder catalogue record. Replace with verified company product information before publishing.', status: 'DRAFT', tags: ['sample', 'unverified'] } });
}
main().finally(() => prisma.$disconnect());
