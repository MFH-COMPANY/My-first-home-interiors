import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from './prisma.service';
import { AuthGuard, CurrentUser, Roles, RolesGuard } from './auth';

class EnquiryUpdateDto { @IsOptional() @IsString() status?: 'NEW'|'IN_PROGRESS'|'RESOLVED'|'ARCHIVED'; @IsOptional() @IsString() assignedAdminId?: string; }
@Controller('admin/workflows') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN')
export class AdminWorkflowsController {
  constructor(private prisma: PrismaService) {}
  @Get('enquiries') listEnquiries(@Query('status') status?: string) { return this.prisma.enquiry.findMany({ where: status ? { status: status as any } : undefined, orderBy: { createdAt: 'desc' }, include: { assignedAdmin: true } }); }
  @Get('enquiries/:id') getEnquiry(@Param('id') id: string) { return this.prisma.enquiry.findUniqueOrThrow({ where: { id }, include: { assignedAdmin: true } }); }
  @Patch('enquiries/:id') updateEnquiry(@Param('id') id: string, @Body() dto: EnquiryUpdateDto, @CurrentUser() user: any) { return this.prisma.$transaction([this.prisma.enquiry.update({ where: { id }, data: dto as any, include: { assignedAdmin: true } }), this.prisma.auditLog.create({ data: { actorUserId: user.id, action: 'UPDATE', entity: 'Enquiry', entityId: id, metadata: dto as any } })]).then((results: any[]) => results[0]); }
  @Patch('enquiries/:id/assign/:adminId') assignEnquiry(@Param('id') id: string, @Param('adminId') adminId: string) { return this.prisma.enquiry.update({ where: { id }, data: { assignedAdminId: adminId }, include: { assignedAdmin: true } }); }
}
