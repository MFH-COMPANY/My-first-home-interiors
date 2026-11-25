import { Body, Controller, Delete, Get, Patch, Post, Param, Query, UseGuards } from '@nestjs/common';
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from './prisma.service';
import { AuthGuard, CurrentUser, Roles, RolesGuard } from './auth';

class ProjectDto {
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsString() slug!: string;
  @IsString() location!: string;
  @IsString() propertyType!: string;
  @IsString() area!: string;
  @IsString() designStyle!: string;
  @IsString() @MinLength(10) description!: string;
  @IsOptional() roomDetails?: unknown;
  @IsOptional() materials?: unknown;
  @IsOptional() furniture?: unknown;
  @IsOptional() status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  @IsOptional() coverImageUrl?: string;
  @IsOptional() @IsArray() media?: Array<{ kind: string; room?: string; url: string; altText?: string }>;
}

class ProductDto {
  @IsString() categoryId!: string; @IsString() name!: string; @IsString() sku!: string; @IsString() description!: string;
  @IsOptional() material?: string; @IsOptional() colour?: string; @IsOptional() finish?: string; @IsOptional() dimensions?: string;
  @IsOptional() availability?: string; @IsOptional() supplier?: string; @IsOptional() tags?: unknown; @IsOptional() priceCents?: number;
  @IsOptional() currency?: string; @IsOptional() status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  @IsOptional() @IsArray() images?: Array<{ url: string; altText?: string }>;
}

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('overview') async overview() {
    const [totalProjects, publishedProjects, catalogueProducts, enquiries, consultationBookings, aiDesignSessions] = await this.prisma.$transaction([
      this.prisma.project.count(), this.prisma.project.count({ where: { status: 'PUBLISHED' } }), this.prisma.catalogueProduct.count(),
      this.prisma.enquiry.count(), this.prisma.consultationBooking.count(), this.prisma.chatSession.count(),
    ]);
    return { totalProjects, publishedProjects, catalogueProducts, enquiries, consultationBookings, aiDesignSessions };
  }

  @Get('projects') async projects(@Query('search') search?: string, @Query('status') status?: string, @Query('page') page = '1', @Query('pageSize') pageSize = '12') {
    const take = Math.min(Math.max(Number(pageSize) || 12, 1), 50); const current = Math.max(Number(page) || 1, 1); const where: any = {};
    if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) where.status = status;
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { location: { contains: search, mode: 'insensitive' } }];
    const [items, total] = await this.prisma.$transaction([this.prisma.project.findMany({ where, take, skip: (current - 1) * take, orderBy: { updatedAt: 'desc' }, include: { media: true } }), this.prisma.project.count({ where })]);
    return { items, total, page: current, pageSize: take };
  }
  @Post('projects') async createProject(@Body() dto: ProjectDto, @CurrentUser() user: any) {
    const { media, ...data } = dto as any;
    const created = await this.prisma.project.create({ data: { ...data, media: media?.length ? { create: media } : undefined } });
    await this.audit(user.id, 'CREATE', 'Project', created.id); return created;
  }
  @Patch('projects/:id') async updateProject(@Param('id') id: string, @Body() dto: Partial<ProjectDto>, @CurrentUser() user: any) {
    const { media, ...data } = dto as any;
    const updated = await this.prisma.project.update({ where: { id }, data: { ...data, media: media ? { deleteMany: {}, create: media } : undefined }, include: { media: true } });
    await this.audit(user.id, 'UPDATE', 'Project', id, { status: data.status }); return updated;
  }
  @Patch('projects/:id/publish') publishProject(@Param('id') id: string, @Body('published') published: boolean, @CurrentUser() user: any) { return this.prisma.project.update({ where: { id }, data: { status: published ? 'PUBLISHED' : 'DRAFT' } }).then(async (project: any) => { await this.audit(user.id, published ? 'PUBLISH' : 'UNPUBLISH', 'Project', id); return project; }); }
  @Delete('projects/:id') async deleteProject(@Param('id') id: string, @CurrentUser() user: any) { const deleted = await this.prisma.project.delete({ where: { id } }); await this.audit(user.id, 'DELETE', 'Project', id); return { id: deleted.id, deleted: true }; }

  @Get('catalogue') async catalogue(@Query('search') search?: string, @Query('categoryId') categoryId?: string, @Query('status') status?: string, @Query('page') page = '1', @Query('pageSize') pageSize = '12') {
    const take = Math.min(Math.max(Number(pageSize) || 12, 1), 50); const current = Math.max(Number(page) || 1, 1); const where: any = {};
    if (categoryId) where.categoryId = categoryId; if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) where.status = status;
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }];
    const [items, total, categories] = await this.prisma.$transaction([this.prisma.catalogueProduct.findMany({ where, take, skip: (current - 1) * take, orderBy: { updatedAt: 'desc' }, include: { category: true, images: { orderBy: { sortOrder: 'asc' } } } }), this.prisma.catalogueProduct.count({ where }), this.prisma.catalogueCategory.findMany({ orderBy: { name: 'asc' } })]);
    return { items, total, categories, page: current, pageSize: take };
  }
  @Post('catalogue') async createProduct(@Body() dto: ProductDto, @CurrentUser() user: any) {
    const { images, ...data } = dto as any; const created = await this.prisma.catalogueProduct.create({ data: { ...data, images: images?.length ? { create: images } : undefined }, include: { images: true, category: true } });
    await this.audit(user.id, 'CREATE', 'CatalogueProduct', created.id); return created;
  }
  @Patch('catalogue/:id') async updateProduct(@Param('id') id: string, @Body() dto: Partial<ProductDto>, @CurrentUser() user: any) {
    const { images, ...data } = dto as any; const updated = await this.prisma.catalogueProduct.update({ where: { id }, data: { ...data, images: images ? { deleteMany: {}, create: images } : undefined }, include: { images: true, category: true } });
    await this.audit(user.id, 'UPDATE', 'CatalogueProduct', id, { status: data.status }); return updated;
  }

  @Get('knowledge') knowledge() { return this.prisma.knowledgeDocument.findMany({ orderBy: { updatedAt: 'desc' } }); }
  @Post('knowledge') async createKnowledge(@Body() body: { title: string; content: string; source?: string }, @CurrentUser() user: any) { const doc = await this.prisma.knowledgeDocument.create({ data: { title: body.title, content: body.content, source: body.source ?? 'admin' } }); await this.audit(user.id, 'CREATE', 'KnowledgeDocument', doc.id); return doc; }
  @Get('audit-logs') logs() { return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }); }
  private audit(actorUserId: string, action: string, entity: string, entityId: string, metadata?: any) { return this.prisma.auditLog.create({ data: { actorUserId, action, entity, entityId, metadata } }); }
}
