import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsDateString, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { AuthGuard, CurrentUser, Roles, RolesGuard } from './auth';

class BookingDto { @IsString() @MinLength(2) name!: string; @IsEmail() email!: string; @IsString() @MinLength(7) phone!: string; @IsDateString() preferredAt!: string; @IsOptional() @IsString() projectId?: string; @IsOptional() @IsString() propertyType?: string; @IsOptional() @IsString() location?: string; @IsOptional() @IsString() @MaxLength(2000) notes?: string; }

@Controller('bookings')
export class BookingsController {
  constructor(private prisma: PrismaService) {}

  @Post() async create(@Body() dto: BookingDto, @CurrentUser() user?: any) {
    const preferredAt = new Date(dto.preferredAt);
    if (preferredAt <= new Date()) throw new BadRequestException('Booking time must be in the future');
    try {
      return await this.prisma.$transaction(async tx => {
        const conflict = await tx.consultationBooking.findFirst({ where: { preferredAt, status: 'CONFIRMED' } });
        if (conflict) throw new BadRequestException('That consultation time is already confirmed');
        return tx.consultationBooking.create({ data: { ...dto, email: dto.email.toLowerCase(), preferredAt, userId: user?.id, status: 'REQUESTED' } });
      }, { isolationLevel: 'Serializable' });
    } catch (error: any) { if (error?.code === 'P2034') throw new BadRequestException('That consultation time was just booked'); throw error; }
  }

  @Get('mine') @UseGuards(AuthGuard) mine(@CurrentUser() user: any) { return this.prisma.consultationBooking.findMany({ where: { userId: user.id }, orderBy: { preferredAt: 'asc' }, include: { project: true } }); }

  @Get() @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN') list(@Query('status') status?: BookingStatus) { return this.prisma.consultationBooking.findMany({ where: status ? { status } : undefined, orderBy: { preferredAt: 'asc' }, include: { project: true, assignedAdmin: true } }); }
  @Patch(':id/status') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN') async status(@Param('id') id: string, @Body('status') status: BookingStatus) {
    if (!Object.values(BookingStatus).includes(status)) throw new BadRequestException('Invalid booking status');
    if (status === 'CONFIRMED') {
      const booking = await this.prisma.consultationBooking.findUniqueOrThrow({ where: { id } });
      const conflict = await this.prisma.consultationBooking.findFirst({ where: { id: { not: id }, preferredAt: booking.preferredAt, status: 'CONFIRMED' } });
      if (conflict) throw new BadRequestException('That consultation time is already confirmed');
    }
    return this.prisma.consultationBooking.update({ where: { id }, data: { status } });
  }
  @Patch(':id/reschedule') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN') async reschedule(@Param('id') id: string, @Body('preferredAt') value: string) {
    if (!value || new Date(value) <= new Date()) throw new BadRequestException('A future preferredAt is required');
    const preferredAt = new Date(value);
    return this.prisma.$transaction(async tx => { const conflict = await tx.consultationBooking.findFirst({ where: { id: { not: id }, preferredAt, status: 'CONFIRMED' } }); if (conflict) throw new BadRequestException('That consultation time is already confirmed'); return tx.consultationBooking.update({ where: { id }, data: { preferredAt, status: 'RESCHEDULED' } }); }, { isolationLevel: 'Serializable' });
  }
}
