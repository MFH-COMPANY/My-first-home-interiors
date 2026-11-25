import { BadRequestException } from '@nestjs/common';
import { UploadsService } from './uploads.service';

describe('UploadsService', () => {
  const config = { getOrThrow: (key: string) => ({ R2_ENDPOINT: 'http://storage', R2_ACCESS_KEY_ID: 'key', R2_SECRET_ACCESS_KEY: 'secret', R2_BUCKET: 'private' } as any)[key], get: (key: string, fallback: any) => fallback } as any;
  it('rejects unsupported content types', async () => {
    const service = new UploadsService(config, {} as any);
    await expect(service.savePrivateRoomUpload('user-1', { mimetype: 'text/plain', size: 2 } as any, new Date().toISOString())).rejects.toBeInstanceOf(BadRequestException);
  });
  it('writes private uploads under the authenticated user scope', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'upload-1' });
    const service = new UploadsService(config, { roomUpload: { create } } as any);
    const send = jest.fn().mockResolvedValue(undefined);
    (service as any).client = { send };
    await service.savePrivateRoomUpload('user-1', { mimetype: 'image/jpeg', size: 3, buffer: Buffer.from('jpg'), originalname: 'room.jpg' } as any, new Date().toISOString());
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ Key: expect.stringMatching(/^private\/user-1\//), Bucket: 'private' }) }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) }));
  });

  it('does not disclose another customer upload', async () => {
    const service = new UploadsService(config, { roomUpload: { findFirst: jest.fn().mockResolvedValue(null) } } as any);
    await expect(service.getPrivateRoomUpload('user-1', 'upload-owned-by-user-2')).rejects.toBeInstanceOf(BadRequestException);
  });
});
