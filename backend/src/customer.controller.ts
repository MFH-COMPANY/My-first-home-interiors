import { BadRequestException, Body, Controller, Delete, Get, Patch, Post, Param, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from './prisma.service';
import { AuthGuard, CurrentUser } from './auth';

class ProfileDto { @IsOptional() @IsString() @MinLength(2) name?: string; @IsOptional() @IsString() phone?: string; @IsOptional() @IsString() location?: string; }
class DeleteDto { @IsOptional() @IsString() @MaxLength(500) reason?: string; }
class ModificationDto { @IsString() designId!: string; @IsString() @MaxLength(4000) changes!: string; }

@Controller('customer') @UseGuards(AuthGuard)
export class CustomerController {
  constructor(private prisma: PrismaService) {}

  @Get('dashboard') async dashboard(@CurrentUser() user: any) {
    const [profile, bookings, enquiries, uploads, designs, saved, chats, modifications] = await Promise.all([
      this.prisma.customerProfile.findUnique({ where: { userId: user.id } }),
      this.prisma.consultationBooking.findMany({ where: { userId: user.id }, orderBy: { preferredAt: 'asc' }, include: { project: true } }),
      this.prisma.enquiry.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
      this.prisma.roomUpload.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { analysis: true } }),
      this.prisma.generatedDesign.findMany({ where: { generation: { analysis: { roomUpload: { userId: user.id } } } }, orderBy: { createdAt: 'desc' }, include: { products: { include: { product: { include: { images: true } } } } } }),
      this.prisma.savedDesign.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { design: { include: { products: { include: { product: { include: { images: true } } } } } } } }),
      this.prisma.chatSession.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { messages: { orderBy: { createdAt: 'asc' } } } }),
      this.prisma.designModification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { design: true } }),
    ]);
    return { profile, bookings, enquiries, uploads, designs, saved, chats, modifications };
  }

  @Patch('profile') profile(@CurrentUser() user: any, @Body() dto: ProfileDto) { return this.prisma.customerProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...dto }, update: dto }); }
  @Post('designs/:id/save') async save(@CurrentUser() user: any, @Param('id') designId: string) { return this.prisma.savedDesign.upsert({ where: { userId_designId: { userId: user.id, designId } }, create: { userId: user.id, designId }, update: {} }); }
  @Delete('designs/:id/save') unsave(@CurrentUser() user: any, @Param('id') designId: string) { return this.prisma.savedDesign.delete({ where: { userId_designId: { userId: user.id, designId } } }); }
  @Post('modifications') modification(@CurrentUser() user: any, @Body() dto: ModificationDto) { let changes: unknown; try { changes = JSON.parse(dto.changes); } catch { throw new BadRequestException('changes must be valid JSON'); } return this.prisma.designModification.create({ data: { userId: user.id, designId: dto.designId, changes: changes as any } }); }
  @Delete('uploads/:id') deleteUpload(@CurrentUser() user: any, @Param('id') id: string) { return this.prisma.roomUpload.delete({ where: { id, userId: user.id } }); }
  @Post('deletion-request') requestDeletion(@CurrentUser() user: any, @Body() dto: DeleteDto) { return this.prisma.accountDeletionRequest.upsert({ where: { userId: user.id }, create: { userId: user.id, reason: dto.reason }, update: { reason: dto.reason, status: 'REQUESTED', requestedAt: new Date() } }); }
}
