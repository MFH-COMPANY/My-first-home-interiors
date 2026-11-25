import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from './prisma.service';

class EnquiryDto { @IsString() @MinLength(2) @MaxLength(120) name!: string; @IsEmail() email!: string; @IsOptional() @IsString() phone?: string; @IsString() @MinLength(10) @MaxLength(5000) message!: string; }
@Controller('enquiries')
export class EnquiriesController { constructor(private prisma: PrismaService) {} @Post() create(@Body() dto: EnquiryDto) { return this.prisma.enquiry.create({ data: { ...dto, email: dto.email.toLowerCase() }, select: { id: true, createdAt: true, name: true } }); } }
