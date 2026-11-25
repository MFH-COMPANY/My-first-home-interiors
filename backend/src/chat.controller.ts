import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from './prisma.service';
import { AiService } from './ai.service';
import { AuthGuard, CurrentUser } from './auth';

class ChatMessageDto { @IsString() @MinLength(1) @MaxLength(4000) content!: string; }
class ChatDto { @IsOptional() @IsString() sessionId?: string; @IsString() @MinLength(1) @MaxLength(4000) message!: string; }

@Controller('chat') @UseGuards(AuthGuard)
export class ChatController {
  constructor(private prisma: PrismaService, private ai: AiService) {}
  @Post('sessions') async create(@CurrentUser() user: any) { return this.prisma.chatSession.create({ data: { userId: user.id }, include: { messages: true } }); }
  @Get('sessions') async sessions(@CurrentUser() user: any) { return this.prisma.chatSession.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } } }); }
  @Get('sessions/:id') async history(@Param('id') id: string, @CurrentUser() user: any) { return this.prisma.chatSession.findFirstOrThrow({ where: { id, userId: user.id }, include: { messages: { orderBy: { createdAt: 'asc' } } } }); }
  @Post('messages') async message(@Body() dto: ChatDto, @CurrentUser() user: any) {
    const session = dto.sessionId ? await this.prisma.chatSession.findFirstOrThrow({ where: { id: dto.sessionId, userId: user.id } }) : await this.prisma.chatSession.create({ data: { userId: user.id } });
    await this.prisma.chatMessage.create({ data: { sessionId: session.id, role: 'user', content: dto.message } });
    const prior = await this.prisma.chatMessage.findMany({ where: { sessionId: session.id }, orderBy: { createdAt: 'asc' }, take: 40 });
    const answer = await this.ai.respond(prior.map(x => ({ role: x.role === 'assistant' ? 'assistant' : 'user', content: x.content })));
    const assistant = await this.prisma.chatMessage.create({ data: { sessionId: session.id, role: 'assistant', content: answer.text } });
    return { sessionId: session.id, message: assistant, products: answer.products, projects: answer.projects };
  }
}
