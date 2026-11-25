import { Body, Controller, Post, Req, UseGuards, UnauthorizedException, ConflictException } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { AuthGuard, CurrentUser } from './auth';
import { createHash, randomBytes } from 'crypto';

class RegisterDto { @IsEmail() email!: string; @IsString() @MinLength(10) password!: string; @IsString() @MinLength(2) name!: string; @IsOptional() @IsString() phone?: string; }
class LoginDto { @IsEmail() email!: string; @IsString() @MinLength(1) password!: string; }

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) {}
  @Post('register') async register(@Body() dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    try { const user = await this.prisma.user.create({ data: { email: dto.email.toLowerCase(), passwordHash, profile: { create: { name: dto.name, phone: dto.phone } } } }); return this.issue(user.id, user.email, user.role); } catch (error: any) { if (error?.code === 'P2002') throw new ConflictException('An account with this email already exists'); throw error; }
  }
  @Post('login') async login(@Body() dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    return this.issue(user.id, user.email, user.role);
  }
  @Post('refresh') async refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token required');
    let payload: { sub: string; sid: string; type?: string };
    try { payload = await this.jwt.verifyAsync(refreshToken, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') }); }
    catch { throw new UnauthorizedException('Invalid refresh token'); }
    const session = await this.prisma.session.findFirst({ where: { id: payload.sid, userId: payload.sub, revokedAt: null, refreshExpiresAt: { gt: new Date() }, refreshTokenHash: this.hash(refreshToken) }, include: { user: true } });
    if (!session) throw new UnauthorizedException('Refresh session expired');
    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return this.issue(session.user.id, session.user.email, session.user.role);
  }
  @UseGuards(AuthGuard)
  @Post('logout') async logout(@Req() req: any) { await this.prisma.session.update({ where: { id: req.sessionId }, data: { revokedAt: new Date() } }); return { loggedOut: true }; }
  @UseGuards(AuthGuard)
  @Post('me') me(@CurrentUser() user: any) { const { passwordHash, ...safe } = user; return safe; }
  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
  private async issue(id: string, email: string, role: string) {
    const refreshToken = randomBytes(48).toString('base64url');
    const session = await this.prisma.session.create({ data: { userId: id, tokenHash: 'pending', refreshTokenHash: this.hash(refreshToken), expiresAt: new Date(Date.now() + 15 * 60 * 1000), refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    const accessToken = await this.jwt.signAsync({ sub: id, email, role, sid: session.id });
    await this.prisma.session.update({ where: { id: session.id }, data: { tokenHash: this.hash(accessToken) } });
    const signedRefresh = await this.jwt.signAsync({ sub: id, sid: session.id, type: 'refresh' }, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET'), expiresIn: '7d' });
    await this.prisma.session.update({ where: { id: session.id }, data: { refreshTokenHash: this.hash(signedRefresh) } });
    return { accessToken, refreshToken: signedRefresh, expiresIn: 900, role };
  }
}
