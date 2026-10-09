import { v4 as uuidv4 } from 'uuid';
import aiJobDao from '../dao/AIJobDao';
import llmService from './LLMService';
import ttsService from './TTSService';
import { IAIPipelineJobDTO, IAIJobResult } from '../types';
import logger from '../logger';

export class JobExecutionService {
  async submitPipelineJob(dto: IAIPipelineJobDTO): Promise<{ jobId: string }> {
    const jobId = uuidv4();
    const timestamp = new Date().toISOString();

    logger.info(`📋 [JobExecutionService] Pipeline job submitted: jobId=${jobId}, type=${dto.jobType}, project=${dto.ownerProject}, ref=${dto.externalReferenceId || 'none'}`);

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
        logger.error(`💥 [JobExecutionService] Error executing job ${jobId}: ${err.message}`, { stack: err.stack });
        aiJobDao.failJob(jobId, err.message).catch(e => logger.error(`[JobExecutionService] Error marking job failed:`, e));
      });
    });

    return { jobId };
  }

  async executeJob(jobId: string, dto: IAIPipelineJobDTO): Promise<void> {
    const jobStartTime = Date.now();
    try {
      logger.info(`⚙️ [JobExecutionService] Starting pipeline job ${jobId}`);
      await aiJobDao.updateJobProgress(jobId, 15, 'Generating natural spoken Tamil bedtime tale...');

      const payload = dto.payload;
      const childName = payload.childName || 'நிலா';
      const prompt = payload.promptIdea || `Create a soothing bedtime story for ${childName}`;

      // 1. Text Generation via LLM
      logger.info(`✍️ [JobExecutionService] Step 1: Generating text via LLM (model=${payload.model || 'gpt-4o-mini'}) for job ${jobId}`);
      const llmStartTime = Date.now();
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
      const llmDuration = Date.now() - llmStartTime;
      logger.info(`✅ [JobExecutionService] Step 1 finished in ${llmDuration}ms (tokens=${textResult.totalTokens}, textLen=${textResult.text?.length || 0})`);

      await aiJobDao.updateJobProgress(jobId, 55, 'Synthesizing voice audio...');

      // 2. Speech Synthesis via TTS
      const audioFileName = dto.externalReferenceId
        ? `${dto.externalReferenceId}_${Date.now()}`
        : jobId;
      const resolvedVoiceId = payload.aiVoiceId || payload.voiceId;
      const resolvedProvider = payload.ttsProvider || payload.voiceProvider || payload.provider;
      const resolvedSpeaker = payload.speaker || payload.voiceName || resolvedVoiceId;

      logger.info(`🎙️ [JobExecutionService] Step 2: Synthesizing TTS audio (speaker=${resolvedSpeaker || 'default'}, provider=${resolvedProvider || 'default'}) for job ${jobId}`);
      const ttsStartTime = Date.now();
      const speechResult = await ttsService.synthesizeSpeech({
        text: textResult.text,
        provider: resolvedProvider,
        speaker: resolvedSpeaker,
        aiVoiceId: resolvedVoiceId,
        languageCode: payload.languageCode || 'ta-IN',
        speakingRate: payload.speakingRate || 0.9,
        emotion: payload.emotion || 'bedtime_calm',
        targetKey: `stories/${audioFileName}.mp3`,
      });
      const ttsDuration = Date.now() - ttsStartTime;
      logger.info(`✅ [JobExecutionService] Step 2 finished in ${ttsDuration}ms (audioDuration=${speechResult.durationSeconds}s, s3Key=${speechResult.audioS3Key})`);

      await aiJobDao.updateJobProgress(jobId, 90, 'Finalizing audio mastering & metadata...');

      // 3. Complete Job
      const totalJobDuration = Date.now() - jobStartTime;
      logger.info(`🎉 [JobExecutionService] Job ${jobId} successfully completed in ${totalJobDuration}ms! Audio URL: ${speechResult.audioUrl}`);
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
      logger.error(`❌ [JobExecutionService] Job ${jobId} failed: ${error.message}`, { stack: error.stack });
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
