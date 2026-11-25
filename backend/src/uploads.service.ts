import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaService } from './prisma.service';
import { randomUUID } from 'crypto';

const allowed = new Set(['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']);
@Injectable()
export class UploadsService {
  private client: S3Client;
  constructor(private config: ConfigService, private prisma: PrismaService) { this.client = new S3Client({ endpoint: config.getOrThrow('R2_ENDPOINT'), region: config.get('R2_REGION','auto'), credentials: { accessKeyId: config.getOrThrow('R2_ACCESS_KEY_ID'), secretAccessKey: config.getOrThrow('R2_SECRET_ACCESS_KEY') } }); }
  async savePrivateRoomUpload(userId: string, file: Express.Multer.File, consentAt: string) {
    const max = Number(this.config.get('MAX_UPLOAD_BYTES', 25_000_000)); if (!file || !allowed.has(file.mimetype)) throw new BadRequestException('Unsupported file type'); if (file.size > max) throw new BadRequestException('File exceeds maximum size'); if (!consentAt || Number.isNaN(Date.parse(consentAt))) throw new BadRequestException('Upload consent is required');
    const key = `private/${userId}/${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_')}`; await this.client.send(new PutObjectCommand({ Bucket: this.config.getOrThrow('R2_BUCKET'), Key: key, Body: file.buffer, ContentType: file.mimetype }));
    return this.prisma.roomUpload.create({ data: { userId, kind: file.mimetype.startsWith('video/') ? 'ROOM_VIDEO' : 'ROOM_IMAGE', storageKey: key, mimeType: file.mimetype, byteSize: file.size, consentAt: new Date(consentAt) } });
  }
  async saveAdminMedia(userId: string, file: Express.Multer.File, entity: 'project' | 'product', entityId: string, kind?: string) {
    const max = Number(this.config.get('MAX_UPLOAD_BYTES', 50_000_000));
    if (!file || !allowed.has(file.mimetype)) throw new BadRequestException('Unsupported file type');
    if (file.size > max) throw new BadRequestException('File exceeds maximum size');
    const key = `admin/${entity}/${entityId}/${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    await this.client.send(new PutObjectCommand({ Bucket: this.config.getOrThrow('R2_BUCKET'), Key: key, Body: file.buffer, ContentType: file.mimetype }));
    const base = this.config.get('R2_PUBLIC_BASE_URL');
    const url = base ? `${base.replace(/\/$/, '')}/${key}` : key;
    if (entity === 'project') return this.prisma.projectMedia.create({ data: { projectId: entityId, kind: kind || (file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE'), url, storageKey: key, altText: file.originalname } });
    return this.prisma.catalogueProductImage.create({ data: { productId: entityId, url, altText: file.originalname } });
  }
}
