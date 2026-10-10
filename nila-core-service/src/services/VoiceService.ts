import voiceProfileDao from '../dao/VoiceProfileDao';
import aiServiceClient from './AIServiceClient';
import { IVoiceProfileSchema } from '../models/VoiceProfile';
import { IRegisterVoiceDTO } from '../types';
import { generateId } from '../utils';
import { getPresignedUploadUrl } from '../database/s3Operations';
import { ValidationError, NotFoundError, ApiError } from '../exceptions/ApiError';
import logger from '../logger';

export class VoiceService {
  getPrompt() {
    return {
      scriptTamil: 'à®’à®°à¯ à®…à®´à®•à®¾à®© à®•à®¾à®Ÿà¯à®² à®’à®°à¯ à®šà®¿à®©à¯à®© à®®à¯à®¯à®²à¯ à®‡à®°à¯à®¨à¯à®¤à¯à®šà¯à®šà®¾à®®à¯. à®…à®¨à¯à®¤ à®®à¯à®¯à®²à¯à®•à¯à®•à¯ à®¨à®¿à®²à®¾à®µ à®°à¯Šà®®à¯à®ª à®ªà®¿à®Ÿà®¿à®•à¯à®•à¯à®®à®¾à®®à¯. à®¤à®¿à®©à®®à¯à®®à¯ à®šà®¾à®¯à®™à¯à®•à®¾à®²à®®à¯ à®µà®¾à®©à®¤à¯à®¤à¯ˆà®ªà¯ à®ªà®¾à®°à¯à®¤à¯à®¤à¯ à®¨à®¿à®²à®¾ à®•à®¿à®Ÿà¯à®Ÿ à®ªà¯‡à®šà¯à®®à®¾à®®à¯. à®¨à®¿à®²à®¾à®µà¯à®®à¯ à®®à¯‡à®•à®™à¯à®•à®³à¯à®•à¯à®•à¯ à®¨à®Ÿà¯à®µà¯à®² à®‡à®°à¯à®¨à¯à®¤à¯ à®šà®¿à®°à®¿à®šà¯à®šà¯à®•à¯à®•à®¿à®Ÿà¯à®Ÿà¯‡ à®ªà®¾à®•à¯à®•à¯à®®à®¾à®®à¯. "à®®à¯à®¯à®²à¯ à®•à¯à®Ÿà¯à®Ÿà®¿, à®¨à¯€ à®¨à®²à¯à®²à®¾ à®¤à¯‚à®™à¯à®•à®£à¯à®®à¯, à®…à®ªà¯à®ªà¯‹à®¤à®¾à®©à¯ à®¨à®¾à®³à¯ˆà®•à¯à®•à¯ à®¤à¯à®³à¯à®³à®¿ à®µà®¿à®³à¯ˆà®¯à®¾à®Ÿ à®®à¯à®Ÿà®¿à®¯à¯à®®à¯"à®©à¯ à®¨à®¿à®²à®¾ à®šà¯Šà®²à¯à®²à¯à®šà¯à®šà®¾à®®à¯...',
      scriptEnglishTransliteration: 'Oru azhagana kaatla oru chinna muyal irundhuchaam. Andha muyalukku nilava romba pidikkumaam...',
      targetDurationSeconds: 45,
      consentStatement: 'I explicitly consent to Nila using my recorded voice sample solely for synthesizing personalized bedtime stories for my family.',
    };
  }

  async getPresignedUploadUrl(userId: string, fileName: string, fileType: string) {
    const bucket = process.env.UPLOADS_BUCKET || 'nila-media-uploads-prod';
    const key = `uploads/voices/${userId}/${Date.now()}_${fileName}`;
    logger.debug(`ðŸŽ¤ [VoiceService] Generating presigned upload URL for voice sample key=${key}`);
    const uploadUrl = await getPresignedUploadUrl({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    });
    return { uploadUrl, key };
  }

  async registerVoice(userId: string, dto: IRegisterVoiceDTO): Promise<IVoiceProfileSchema> {
    if (!dto.consentAffirmed) {
      throw new ValidationError('Parent consent affirmation is required to clone voice');
    }

    const voiceId = generateId('voc');
    const timestamp = new Date().toISOString();
    const voiceProvider = (dto.provider || dto.voiceProvider || 'sarvam').toLowerCase();

    const voice: IVoiceProfileSchema = {
      voiceId,
      provider: voiceProvider,
      voiceProvider,
      userId,
      displayName: dto.displayName,
      relationship: dto.relationship,
      sampleAudioS3Key: dto.sampleAudioS3Key,
      sampleDurationSeconds: dto.sampleDurationSeconds,
      consentVerified: true,
      status: 'PROCESSING',
      isDefault: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await voiceProfileDao.createVoice(voice);
    logger.info(`ðŸŽ¤ [VoiceService] Registered voice profile ${voiceId} ("${dto.displayName}") [provider=${voiceProvider}] for user=${userId}`);

    // In AWS Lambda, background tasks freeze as soon as the HTTP response returns.
    // Execute voice cloning synchronously within the active request context:
    try {
      const bucket = process.env.UPLOADS_BUCKET || 'nila-media-uploads-prod';
      const sampleUrl = `https://${bucket}.s3.amazonaws.com/${dto.sampleAudioS3Key}`;

      logger.info(`ðŸŽ¤ [VoiceService] Sending voice clone request to AI service for voiceId=${voiceId} (provider=${voiceProvider})`, {
        sampleAudioS3Key: dto.sampleAudioS3Key,
        sampleUrl,
        displayName: dto.displayName,
      });

      const cloneResult = await aiServiceClient.cloneVoice({
        ownerProject: 'nila',
        externalReferenceId: voiceId,
        sampleAudioUrls: [sampleUrl, dto.sampleAudioS3Key],
        displayName: dto.displayName,
        provider: voiceProvider,
        voiceProvider,
      });

      const finalProvider = cloneResult.provider || voiceProvider;
      const finalProviderVoiceId = cloneResult.providerVoiceId || cloneResult.aiVoiceId;
      logger.info(`ðŸŽ‰ [VoiceService] Voice cloning succeeded for voiceId=${voiceId}: aiVoiceId=${cloneResult.aiVoiceId}, providerVoiceId=${finalProviderVoiceId}, provider=${finalProvider}`);
      await voiceProfileDao.updateVoiceStatus(
        voiceId,
        'READY',
        cloneResult.previewAudioUrl,
        cloneResult.aiVoiceId,
        finalProvider,
        finalProviderVoiceId
      );
      return {
        ...voice,
        status: 'READY',
        aiServiceVoiceId: cloneResult.aiVoiceId,
        providerVoiceId: finalProviderVoiceId,
        previewAudioUrl: cloneResult.previewAudioUrl,
      };
    } catch (err: any) {
      logger.error(`ðŸ’¥ [VoiceService] Failed to train voice ${voiceId}: ${err.message}`, { stack: err.stack });
      await voiceProfileDao.updateVoiceStatus(voiceId, 'FAILED', undefined, undefined, voiceProvider);
      throw new ApiError(`Voice cloning training failed: ${err.message}`, 500);
    }
  }

  async getVoices(userId: string): Promise<IVoiceProfileSchema[]> {
    return await voiceProfileDao.getVoicesByUserId(userId);
  }

  async getVoice(voiceId: string, provider?: string): Promise<IVoiceProfileSchema> {
    const voice = await voiceProfileDao.getVoice(voiceId, provider);
    if (!voice) {
      throw new NotFoundError(`Voice profile ${voiceId}${provider ? ` (${provider})` : ''} not found`);
    }
    return voice;
  }

  async deleteVoice(voiceId: string, provider?: string): Promise<void> {
    await voiceProfileDao.deleteVoice(voiceId, provider);
    logger.info(`ðŸŽ¤ [VoiceService] Deleted voice profile ${voiceId}${provider ? ` (${provider})` : ''}`);
  }
}

export default new VoiceService();
