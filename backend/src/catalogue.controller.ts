import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('catalogue')
export class CatalogueController {
  constructor(private prisma: PrismaService) {}
  @Get('categories') categories() { return this.prisma.catalogueCategory.findMany({ orderBy: { name: 'asc' } }); }
  @Get('products') products(@Query('categoryId') categoryId?: string, @Query('search') search?: string) {
    const where: any = { status: 'PUBLISHED' }; if (categoryId) where.categoryId = categoryId;
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }];
    return this.prisma.catalogueProduct.findMany({ where, include: { category: true, images: { orderBy: { sortOrder: 'asc' } } }, orderBy: { updatedAt: 'desc' } });
  }
}
