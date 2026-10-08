import memoryDao from '../dao/MemoryDao';
import { IMemorySchema } from '../models/Memory';
import { ICreateMemoryDTO } from '../types';
import { generateId } from '../utils';
import { getPresignedUploadUrl, uploadBufferToS3 } from '../database/s3Operations';
import { ValidationError, NotFoundError } from '../exceptions/ApiError';

export class MemoryService {
  async createMemory(userId: string, dto: ICreateMemoryDTO): Promise<IMemorySchema> {
    if (!dto.title || !dto.description) {
      throw new ValidationError('Memory title and description are required');
    }

    const memoryId = generateId('mem');
    const timestamp = new Date().toISOString();

    const memory: IMemorySchema = {
      memoryId,
      userId,
      childId: dto.childId,
      title: dto.title,
      description: dto.description,
      photoUrl: dto.photoUrl,
      eventDate: dto.eventDate || timestamp.slice(0, 10),
      tags: dto.tags || [],
      wovenStoryCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await memoryDao.createMemory(memory);
    return memory;
  }

  async getMemories(userId: string, childId?: string): Promise<IMemorySchema[]> {
    if (childId) {
      return await memoryDao.getMemoriesByChildId(childId);
    }
    return await memoryDao.getMemoriesByUserId(userId);
  }

  async getPresignedUploadUrl(
    userId: string,
    fileName: string,
    fileType: string,
    fileBuffer?: Buffer
  ) {
    if (!fileName) {
      throw new ValidationError('fileName (or an attached file) is required');
    }

    const bucket = process.env.UPLOADS_BUCKET || 'nila-media-uploads-prod';
    const key = `uploads/memories/${userId}/${Date.now()}_${fileName}`;
    const cdnUrl = process.env.CDN_URL || 'https://cdn.nila.app';
    const publicUrl = `${cdnUrl}/${key}`;
    const resolvedFileType = fileType || 'image/jpeg';

    if (fileBuffer && fileBuffer.length > 0) {
      // Direct binary upload to S3
      await uploadBufferToS3({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: resolvedFileType,
      });

      return {
        uploaded: true,
        message: 'File uploaded successfully to S3',
        key,
        publicUrl,
      };
    }

    // Presigned upload URL flow
    const uploadUrl = await getPresignedUploadUrl({
      Bucket: bucket,
      Key: key,
      ContentType: resolvedFileType,
    });

    return {
      uploaded: false,
      uploadUrl,
      key,
      publicUrl,
    };
  }

  async getMemory(memoryId: string): Promise<IMemorySchema> {
    const memory = await memoryDao.getMemory(memoryId);
    if (!memory) {
      throw new NotFoundError(`Memory ${memoryId} not found`);
    }
    return memory;
  }

  async updateMemory(memoryId: string, updates: Partial<IMemorySchema>): Promise<IMemorySchema> {
    await memoryDao.updateMemory(memoryId, updates);
    return await this.getMemory(memoryId);
  }

  async deleteMemory(memoryId: string): Promise<void> {
    await memoryDao.deleteMemory(memoryId);
  }
}

export default new MemoryService();
