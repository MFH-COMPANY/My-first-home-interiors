import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() { const app = await NestFactory.create(AppModule); app.use(helmet()); app.enableCors({ origin: process.env.FRONTEND_ORIGIN?.split(',').map(x=>x.trim()) ?? false, credentials: true }); app.setGlobalPrefix('api'); app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true})); await app.listen(Number(process.env.PORT ?? 4000)); }
bootstrap();
