import memoryDao from '../dao/MemoryDao';
import { IMemorySchema } from '../models/Memory';
import { ICreateMemoryDTO } from '../types';
import { generateId } from '../utils';
import { getPresignedUploadUrl } from '../database/s3Operations';
import { ValidationError } from '../exceptions/ApiError';

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

  async getPresignedUploadUrl(userId: string, fileName: string, fileType: string) {
    const bucket = process.env.UPLOADS_BUCKET || 'nila-media-uploads-prod';
    const key = `uploads/memories/${userId}/${Date.now()}_${fileName}`;
    const uploadUrl = await getPresignedUploadUrl({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    });
    const cdnUrl = process.env.CDN_URL || 'https://cdn.nila.app';

    return {
      uploadUrl,
      key,
      publicUrl: `${cdnUrl}/${key}`,
    };
  }

  async deleteMemory(memoryId: string): Promise<void> {
    await memoryDao.deleteMemory(memoryId);
  }
}

export default new MemoryService();
