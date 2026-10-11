import userDao from '../dao/UserDao';
import childDao from '../dao/ChildDao';
import storyDao from '../dao/StoryDao';
import memoryDao from '../dao/MemoryDao';
import voiceProfileDao from '../dao/VoiceProfileDao';
import { IUserSchema } from '../models/User';
import { NotFoundError } from '../exceptions/ApiError';
import logger from '../logger';

export class ParentService {
  async getProfile(userId: string): Promise<IUserSchema> {
    const user = await userDao.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return user;
  }

  async updateProfile(userId: string, updates: Partial<IUserSchema>): Promise<IUserSchema> {
    await userDao.updateUser(userId, updates);
    return await this.getProfile(userId);
  }

  async deleteAccount(userId: string): Promise<void> {
    logger.info(`🗑️ [ParentService] Initiating account deletion for userId=${userId}`);

    // 1. Delete all children
    try {
      const children = await childDao.getChildrenByUserId(userId);
      for (const child of children) {
        await childDao.deleteChild(child.childId);
      }
      logger.info(`🗑️ [ParentService] Deleted ${children.length} children for userId=${userId}`);
    } catch (err: any) {
      logger.warn(`[ParentService] Error deleting children for userId=${userId}: ${err.message}`);
    }

    // 2. Delete all stories
    try {
      const stories = await storyDao.getStoriesByUserId(userId);
      for (const story of stories) {
        await storyDao.deleteStory(story.storyId);
      }
      logger.info(`🗑️ [ParentService] Deleted ${stories.length} stories for userId=${userId}`);
    } catch (err: any) {
      logger.warn(`[ParentService] Error deleting stories for userId=${userId}: ${err.message}`);
    }

    // 3. Delete all memories
    try {
      const memories = await memoryDao.getMemoriesByUserId(userId);
      for (const memory of memories) {
        await memoryDao.deleteMemory(memory.memoryId);
      }
      logger.info(`🗑️ [ParentService] Deleted ${memories.length} memories for userId=${userId}`);
    } catch (err: any) {
      logger.warn(`[ParentService] Error deleting memories for userId=${userId}: ${err.message}`);
    }

    // 4. Delete all voice profiles
    try {
      const voices = await voiceProfileDao.getVoicesByUserId(userId);
      for (const voice of voices) {
        await voiceProfileDao.deleteVoice(voice.voiceId, voice.provider);
      }
      logger.info(`🗑️ [ParentService] Deleted ${voices.length} voices for userId=${userId}`);
    } catch (err: any) {
      logger.warn(`[ParentService] Error deleting voices for userId=${userId}: ${err.message}`);
    }

    // 5. Delete user profile record
    await userDao.deleteUser(userId);
    logger.info(`✅ [ParentService] User account successfully deleted: userId=${userId}`);
  }
}

export default new ParentService();
