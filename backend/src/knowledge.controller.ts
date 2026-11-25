import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AuthGuard, CurrentUser, Roles, RolesGuard } from './auth';
import { PrismaService } from './prisma.service';
import { AiService } from './ai.service';
class KnowledgeDto { @IsString() @MinLength(2) title!: string; @IsString() @MinLength(10) content!: string; @IsString() source!: string; }
@Controller('admin/knowledge') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN')
export class KnowledgeController {
  constructor(private prisma: PrismaService, private ai: AiService) {}
  @Post() async create(@Body() dto: KnowledgeDto, @CurrentUser() user: any) { const doc = await this.prisma.knowledgeDocument.create({ data: dto }); await this.ai.indexDocument(doc.id); await this.prisma.auditLog.create({ data: { actorUserId: user.id, action: 'INDEX', entity: 'KnowledgeDocument', entityId: doc.id } }); return this.prisma.knowledgeDocument.findUnique({ where: { id: doc.id }, include: { chunks: { select: { id: true, chunkIndex: true } } } }); }
  @Post(':id/reindex') async reindex(@Param('id') id: string) { return this.ai.indexDocument(id); }
  @Delete(':id') async remove(@Param('id') id: string, @CurrentUser() user: any) { const result = await this.ai.removeDocument(id); await this.prisma.auditLog.create({ data: { actorUserId: user.id, action: 'DELETE', entity: 'KnowledgeDocument', entityId: id } }); return result; }
}
