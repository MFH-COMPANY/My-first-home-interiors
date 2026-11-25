import { Controller, Post, Req, UseGuards, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard, CurrentUser, Roles, RolesGuard } from './auth';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private uploads: UploadsService) {}
  @Post('room') @UseGuards(AuthGuard) @UseInterceptors(FileInterceptor('file',{ storage: memoryStorage(), limits:{fileSize:25_000_000} })) upload(@CurrentUser() user:any,@UploadedFile() file:Express.Multer.File,@Body('consentAt') consentAt:string){ return this.uploads.savePrivateRoomUpload(user.id,file,consentAt); }
  @Post('admin') @UseGuards(AuthGuard, RolesGuard) @Roles('ADMIN') @UseInterceptors(FileInterceptor('file',{ storage: memoryStorage(), limits:{fileSize:50_000_000} })) adminUpload(@CurrentUser() user:any,@UploadedFile() file:Express.Multer.File,@Body('entity') entity:'project'|'product',@Body('entityId') entityId:string,@Body('kind') kind?:string){ return this.uploads.saveAdminMedia(user.id,file,entity,entityId,kind); }
}
