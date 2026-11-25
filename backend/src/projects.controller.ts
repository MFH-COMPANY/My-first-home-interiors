import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('projects')
export class ProjectsController {
  constructor(private prisma: PrismaService) {}
  @Get() list(@Query('propertyType') propertyType?: string, @Query('room') room?: string, @Query('style') style?: string, @Query('search') search?: string, @Query('page') page = '1', @Query('pageSize') pageSize = '24') {
    const take = Math.min(Math.max(Number(pageSize) || 24, 1), 50); const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const where: any = { status: 'PUBLISHED' }; if (propertyType) where.propertyType = propertyType; if (style) where.designStyle = style; if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { location: { contains: search, mode: 'insensitive' } }];
    return this.prisma.$transaction([this.prisma.project.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { media: { orderBy: { sortOrder: 'asc' } }, services: true } }), this.prisma.project.count({ where })]).then(([items,total]) => ({ items, total, page: Math.floor(skip / take) + 1, pageSize: take }));
  }
  @Get(':id') get(@Param('id') id: string) { return this.prisma.project.findFirstOrThrow({ where: { id, status: 'PUBLISHED' }, include: { media: { orderBy: { sortOrder: 'asc' } }, services: true } }); }
}
