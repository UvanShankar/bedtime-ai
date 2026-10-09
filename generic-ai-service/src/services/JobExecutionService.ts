import { v4 as uuidv4 } from 'uuid';
import aiJobDao from '../dao/AIJobDao';
import llmService from './LLMService';
import ttsService from './TTSService';
import { IAIPipelineJobDTO, IAIJobResult } from '../types';

export class JobExecutionService {
  async submitPipelineJob(dto: IAIPipelineJobDTO): Promise<{ jobId: string }> {
    const jobId = uuidv4();
    const timestamp = new Date().toISOString();

    await aiJobDao.createJob({
      jobId,
      jobType: dto.jobType,
      ownerProject: dto.ownerProject,
      externalReferenceId: dto.externalReferenceId,
      requestPayload: dto.payload,
      status: 'PENDING',
      progressPercent: 0,
      stageMessage: 'Queued for processing',
      createdAt: timestamp,
      updatedAt: timestamp,
      expiresAt: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days retention
    });

    // In a microservice cluster, this message is sent to SQS.
    // For standalone/direct execution, trigger execution asynchronously:
    setImmediate(() => {
      this.executeJob(jobId, dto).catch(err => {
        console.error(`[JobExecutionService] Error running job ${jobId}:`, err);
        aiJobDao.failJob(jobId, err.message).catch(e => console.error(`[JobExecutionService] Error marking job failed:`, e));
      });
    });

    return { jobId };
  }

  async executeJob(jobId: string, dto: IAIPipelineJobDTO): Promise<void> {
    try {
      await aiJobDao.updateJobProgress(jobId, 15, 'Generating natural spoken Tamil bedtime tale...');

      const payload = dto.payload;
      const childName = payload.childName || 'நிலா';
      const prompt = payload.promptIdea || `Create a soothing bedtime story for ${childName}`;

      // 1. Text Generation via LLM
      const textResult = await llmService.generateText({
        provider: payload.llmProvider || payload.provider,
        model: payload.model || 'gpt-4o-mini',
        systemInstruction: payload.systemInstruction || 'You are an affectionate Tamil parent telling a bedtime story...',
        prompt,
        templateVariables: {
          childName,
          dialect: payload.dialect || 'Chennai',
          memorySnippet: payload.memorySnippet || '',
        },
        temperature: payload.temperature ?? 0.7,
        maxTokens: payload.maxTokens || 1024,
      });

      await aiJobDao.updateJobProgress(jobId, 55, 'Synthesizing voice audio...');

      // 2. Speech Synthesis via TTS
      const audioFileName = dto.externalReferenceId
        ? `${dto.externalReferenceId}_${Date.now()}`
        : jobId;
      const speechResult = await ttsService.synthesizeSpeech({
        text: textResult.text,
        provider: payload.ttsProvider,
        speaker: payload.speaker || payload.voiceName || payload.aiVoiceId,
        aiVoiceId: payload.aiVoiceId,
        languageCode: payload.languageCode || 'ta-IN',
        speakingRate: payload.speakingRate || 0.9,
        emotion: payload.emotion || 'bedtime_calm',
        targetKey: `stories/${audioFileName}.mp3`,
      });

      await aiJobDao.updateJobProgress(jobId, 90, 'Finalizing audio mastering & metadata...');

      // 3. Complete Job
      await aiJobDao.completeJob(
        jobId,
        {
          storyScript: textResult.text,
          audioUrl: speechResult.audioUrl,
          audioS3Key: speechResult.audioS3Key,
          durationSeconds: speechResult.durationSeconds,
          backgroundMusic: payload.ambientMusic?.trackId || 'gentle_lullaby',
        },
        {
          tokens: textResult.totalTokens,
          seconds: speechResult.durationSeconds,
        }
      );
    } catch (error: any) {
      console.error(`[JobExecutionService] Job ${jobId} failed:`, error);
      await aiJobDao.failJob(jobId, error.message || 'Unknown processing error');
    }
  }

  async getJobStatus(jobId: string): Promise<IAIJobResult | null> {
    const job = await aiJobDao.getJob(jobId);
    if (!job) return null;

    return {
      jobId: job.jobId,
      status: job.status,
      progressPercent: job.progressPercent,
      result: job.resultPayload,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      completedAt: (job as any).completedAt,
    };
  }
}

export default new JobExecutionService();
