import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth.controller';
import { ProjectsController } from './projects.controller';
import { EnquiriesController } from './enquiries.controller';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { RolesGuard } from './auth';
import { AdminController } from './admin.controller';
import { CatalogueController } from './catalogue.controller';
import { BookingsController } from './bookings.controller';
import { AdminWorkflowsController } from './admin-workflows.controller';
import { ChatController } from './chat.controller';
import { KnowledgeController } from './knowledge.controller';
import { AiService } from './ai.service';

@Module({ imports:[ConfigModule.forRoot({isGlobal:true}), ThrottlerModule.forRoot([{ttl:60000,limit:100}]), JwtModule.registerAsync({global:true,inject:[ConfigService],useFactory:(config:ConfigService)=>({secret:config.getOrThrow('JWT_SECRET'),signOptions:{expiresIn:config.get('JWT_EXPIRES_IN','15m')}})})], controllers:[AuthController,ProjectsController,EnquiriesController,UploadsController,AdminController,CatalogueController,BookingsController,AdminWorkflowsController,ChatController,KnowledgeController], providers:[PrismaService,UploadsService,RolesGuard,AiService,{ provide: APP_GUARD, useClass: ThrottlerGuard }] })
export class AppModule {}
