import childDao from '../dao/ChildDao';
import { IChildSchema } from '../models/Child';
import { ICreateChildDTO } from '../types';
import { generateId } from '../utils';
import { NotFoundError, ValidationError } from '../exceptions/ApiError';

export class ChildService {
  async createChild(userId: string, dto: ICreateChildDTO): Promise<IChildSchema> {
    if (!dto.name) {
      throw new ValidationError("Child's name is required");
    }

    const childId = generateId('chd');
    const timestamp = new Date().toISOString();

    const child: IChildSchema = {
      childId,
      userId,
      name: dto.name,
      gender: dto.gender || 'unspecified',
      age: dto.age || 4,
      bedtimeHour: dto.bedtimeHour ?? 21,
      bedtimeMinute: dto.bedtimeMinute ?? 0,
      interests: dto.interests || [],
      fearsToAvoid: dto.fearsToAvoid || [],
      favoriteCharacters: dto.favoriteCharacters || [],
      storySettings: {
        tamilDialect: dto.storySettings?.tamilDialect || 'Standard',
        slangLevel: dto.storySettings?.slangLevel || 'natural',
        bedtimePacing: dto.storySettings?.bedtimePacing || 'gentle_slowdown',
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await childDao.createChild(child);
    return child;
  }

  async getChildren(userId: string): Promise<IChildSchema[]> {
    return await childDao.getChildrenByUserId(userId);
  }

  async getChild(childId: string): Promise<IChildSchema> {
    const child = await childDao.getChild(childId);
    if (!child) {
      throw new NotFoundError(`Child profile ${childId} not found`);
    }
    return child;
  }

  async updateChild(childId: string, updates: Partial<IChildSchema>): Promise<IChildSchema> {
    await childDao.updateChild(childId, updates);
    return await this.getChild(childId);
  }

  async deleteChild(childId: string): Promise<void> {
    await childDao.deleteChild(childId);
  }
}

export default new ChildService();
