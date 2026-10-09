import storyDao from '../dao/StoryDao';
import childDao from '../dao/ChildDao';
import memoryDao from '../dao/MemoryDao';
import voiceProfileDao from '../dao/VoiceProfileDao';
import aiServiceClient from './AIServiceClient';
import { IStorySchema } from '../models/Story';
import { IRequestStoryDTO } from '../types';
import { generateId } from '../utils';
import { NotFoundError, ValidationError } from '../exceptions/ApiError';
import logger from '../logger';

export class StoryService {
  async requestStory(userId: string, dto: IRequestStoryDTO): Promise<IStorySchema> {
    logger.info(`📖 [StoryService] Requesting story generation for user=${userId}, childId=${dto.childId}`, {
      childId: dto.childId,
      voiceId: dto.voiceId,
      theme: dto.theme,
      dialect: dto.dialect,
      model: dto.model,
      speaker: dto.speaker || dto.voiceName,
    });

    const child = await childDao.getChild(dto.childId);
    if (!child) {
      throw new NotFoundError(`Child profile ${dto.childId} not found`);
    }

    let aiVoiceId: string | undefined;
    if (dto.voiceId) {
      const voice = await voiceProfileDao.getVoice(dto.voiceId);
      if (voice && voice.aiServiceVoiceId) {
        aiVoiceId = voice.aiServiceVoiceId;
      }
    }

    // Collect included memories
    let memorySnippet = '';
    if (dto.includeMemoryIds && dto.includeMemoryIds.length > 0) {
      const memories = await Promise.all(
        dto.includeMemoryIds.map(id => memoryDao.getMemory(id))
      );
      memorySnippet = memories
        .filter(Boolean)
        .map(m => `${m!.title}: ${m!.description}`)
        .join('. ');
    }

    const storyId = generateId('sty');
    const timestamp = new Date().toISOString();

    const dialect = dto.dialect || child.storySettings?.tamilDialect || 'Chennai';
    const targetDurationMinutes = dto.targetDurationMinutes || 7;

    const story: IStorySchema = {
      storyId,
      userId,
      childId: dto.childId,
      voiceId: dto.voiceId,
      title: `${child.name}-இன் நிலா கதை`,
      theme: dto.theme || 'bedtime_calm',
      targetDurationMinutes,
      moralLesson: dto.moralLesson,
      includedMemoryIds: dto.includeMemoryIds || [],
      language: 'ta',
      dialect,
      status: 'QUEUED',
      progressPercent: 5,
      stageMessage: 'Initiating bedtime story creation...',
      isFavorite: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await storyDao.createStory(story);
    logger.info(`✅ [StoryService] Created initial story record storyId=${storyId}`);

    // Prompt engineering for natural spoken Tamil bedtime story
    const systemInstruction = `You are an affectionate Tamil parent telling an intimate bedtime story to your child named ${child.name}.
RULES:
1. Speak in NATURAL SPOKEN TAMIL (எளிய பேச்சுத் தமிழ்), exactly how parents talk to kids at home.
2. DO NOT use archaic literary/formal Tamil (தூய தமிழ்) like 'சென்றான்', 'கூறினான்', 'மகிழ்ந்தான்'. Use 'போனான்', 'சொன்னான்', 'ரொம்ப சந்தோஷப்பட்டான்'.
3. Use ${dialect} Tamil slang/cadence where appropriate.
4. Gently wind down towards the end so the child feels relaxed and ready to sleep.`;

    const promptIdea = dto.promptIdea || `A magical bedtime story about ${child.name} discovering something heartwarming.`;

    // Asynchronously trigger AI Service pipeline
    setImmediate(async () => {
      try {
        await storyDao.updateStoryStatus(storyId, 'GENERATING_SCRIPT', 25, 'Writing story in natural spoken Tamil...');

        logger.info(`🚀 [StoryService] Submitting story pipeline to AI service for storyId=${storyId}`);
        const job = await aiServiceClient.submitStoryPipeline({
          storyId,
          childName: child.name,
          promptIdea,
          systemInstruction,
          dialect,
          memorySnippet,
          aiVoiceId,
          model: dto.model,
          llmProvider: dto.llmProvider,
          ttsProvider: dto.ttsProvider,
          speaker: dto.speaker || dto.voiceName,
          speakingRate: dto.speakingRate,
        });

        logger.info(`⏳ [StoryService] AI job dispatched: jobId=${job.jobId} for storyId=${storyId}`);

        // Poll job until ready (20 minutes = 1200s -> 400 attempts at 3-second intervals)
        const pollIntervalMs = Number(process.env.STORY_POLL_INTERVAL_MS) || 3000;
        const maxAttempts = Number(process.env.STORY_MAX_POLL_ATTEMPTS) || 400; // 400 * 3s = 1200s (20 mins)
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await aiServiceClient.getJobStatus(job.jobId);
            logger.debug(`🔄 [StoryService] Polling jobId=${job.jobId} attempt=${attempts}/${maxAttempts}: status=${statusRes.status}, progress=${statusRes.progressPercent}%`);

            if (statusRes.status === 'COMPLETED' && statusRes.result) {
              clearInterval(interval);
              logger.info(`🎉 [StoryService] AI job completed for storyId=${storyId}! Audio: ${statusRes.result.audioUrl}`);
              await storyDao.completeStory(storyId, {
                storyScript: statusRes.result.storyScript,
                audioUrl: statusRes.result.audioUrl,
                audioS3Key: statusRes.result.audioS3Key,
                audioDurationSeconds: statusRes.result.durationSeconds || targetDurationMinutes * 60,
                coverImageUrl: 'https://cdn.nila.app/covers/default_moon.png',
              });
            } else if (statusRes.status === 'FAILED') {
              clearInterval(interval);
              logger.error(`❌ [StoryService] AI job failed for storyId=${storyId}: ${statusRes.errorMessage}`);
              await storyDao.updateStoryStatus(storyId, 'FAILED', 0, statusRes.errorMessage || 'Generation failed');
            } else {
              await storyDao.updateStoryStatus(
                storyId,
                statusRes.progressPercent > 50 ? 'SYNTHESIZING_VOICE' : 'GENERATING_SCRIPT',
                statusRes.progressPercent
              );
            }
          } catch (pollErr: any) {
            logger.error(`⚠️ [StoryService] Poll error for jobId=${job.jobId}: ${pollErr.message}`);
          }

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            const timeoutMinutes = Math.round((maxAttempts * pollIntervalMs) / 60000);
            logger.error(`⏰ [StoryService] Story generation timed out after ${timeoutMinutes} minutes for storyId=${storyId}`);
            await storyDao.updateStoryStatus(storyId, 'FAILED', 0, `Story generation timed out after ${timeoutMinutes} minutes`);
          }
        }, pollIntervalMs);
      } catch (err: any) {
        logger.error(`💥 [StoryService] Failed to generate story ${storyId}: ${err.message}`, { stack: err.stack });
        await storyDao.updateStoryStatus(storyId, 'FAILED', 0, err.message);
      }
    });

    return story;
  }

  async getStoryStatus(storyId: string) {
    const story = await storyDao.getStory(storyId);
    if (!story) {
      throw new NotFoundError(`Story ${storyId} not found`);
    }
    return {
      storyId: story.storyId,
      status: story.status,
      progressPercent: story.progressPercent,
      stageMessage: story.stageMessage,
      audioUrl: story.audioUrl,
    };
  }

  async getStory(storyId: string): Promise<IStorySchema> {
    const story = await storyDao.getStory(storyId);
    if (!story) {
      throw new NotFoundError(`Story ${storyId} not found`);
    }
    return story;
  }

  async getStories(userId: string, childId?: string): Promise<IStorySchema[]> {
    if (childId) {
      return await storyDao.getStoriesByChildId(childId);
    }
    return await storyDao.getStoriesByUserId(userId);
  }

  async toggleFavorite(storyId: string, isFavorite: boolean): Promise<void> {
    await storyDao.toggleFavorite(storyId, isFavorite);
  }
}

export default new StoryService();
