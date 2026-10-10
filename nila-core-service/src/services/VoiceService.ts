import voiceProfileDao from '../dao/VoiceProfileDao';
import aiServiceClient from './AIServiceClient';
import { IVoiceProfileSchema } from '../models/VoiceProfile';
import { IRegisterVoiceDTO } from '../types';
import { generateId } from '../utils';
import { getPresignedUploadUrl, getPresignedDownloadUrl } from '../database/s3Operations';
import { ValidationError, NotFoundError, ApiError } from '../exceptions/ApiError';
import logger from '../logger';

export class VoiceService {
  getPrompt() {
    return {
      scriptTamil: 'ஒரு அழகான காட்ல ஒரு சின்ன முயல் இருந்துச்சாம். அந்த முயலுக்கு நிலாவ ரொம்ப பிடிக்குமாம். தினமும் சாயங்காலம் வானத்தைப் பார்த்து நிலா கிட்ட பேசுமாம். நிலாவும் மேகங்களுக்கு நடுவுல இருந்து சிரிச்சுக்கிட்டே பாக்குமாம். "முயல் குட்டி, நீ நல்லா தூங்கணும், அப்போதான் நாளைக்கு துள்ளி விளையாட முடியும்"னு நிலா சொல்லுச்சாம்...',
      scriptEnglishTransliteration: 'Oru azhagana kaatla oru chinna muyal irundhuchaam. Andha muyalukku nilava romba pidikkumaam...',
      targetDurationSeconds: 45,
      consentStatement: 'I explicitly consent to Nila using my recorded voice sample solely for synthesizing personalized bedtime stories for my family.',
    };
  }

  async getPresignedUploadUrl(userId: string, fileName: string, fileType: string) {
    const bucket = process.env.UPLOADS_BUCKET || 'nila-media-uploads-prod';
    const key = `uploads/voices/${userId}/${Date.now()}_${fileName}`;
    logger.debug(`🎤 [VoiceService] Generating presigned upload URL for voice sample key=${key}`);
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
    logger.info(`🎤 [VoiceService] Registered voice profile ${voiceId} ("${dto.displayName}") [provider=${voiceProvider}] for user=${userId}`);

    // In AWS Lambda, background tasks freeze as soon as the HTTP response returns.
    // Execute voice cloning synchronously within the active request context:
    try {
      const bucket = process.env.UPLOADS_BUCKET || 'nila-media-uploads-prod';
      const sampleUrl = `https://${bucket}.s3.amazonaws.com/${dto.sampleAudioS3Key}`;

      logger.info(`🎤 [VoiceService] Sending voice clone request to AI service for voiceId=${voiceId} (provider=${voiceProvider})`, {
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
      logger.info(`🎉 [VoiceService] Voice cloning succeeded for voiceId=${voiceId}: aiVoiceId=${cloneResult.aiVoiceId}, providerVoiceId=${finalProviderVoiceId}, provider=${finalProvider}`);
      await voiceProfileDao.updateVoiceStatus(
        voiceId,
        'READY',
        cloneResult.previewAudioUrl,
        cloneResult.aiVoiceId,
        finalProvider,
        finalProviderVoiceId
      );
      const readyVoice: IVoiceProfileSchema = {
        ...voice,
        status: 'READY',
        aiServiceVoiceId: cloneResult.aiVoiceId,
        providerVoiceId: finalProviderVoiceId,
        previewAudioUrl: cloneResult.previewAudioUrl,
      };
      return await this.attachPresignedUrl(readyVoice);
    } catch (err: any) {
      logger.error(`💥 [VoiceService] Failed to train voice ${voiceId}: ${err.message}`, { stack: err.stack });
      await voiceProfileDao.updateVoiceStatus(voiceId, 'FAILED', undefined, undefined, voiceProvider);
      throw new ApiError(`Voice cloning training failed: ${err.message}`, 500);
    }
  }

  private async attachPresignedUrl(voice: IVoiceProfileSchema): Promise<IVoiceProfileSchema> {
    if (voice.sampleAudioS3Key && !voice.previewAudioUrl) {
      try {
        const bucket = process.env.UPLOADS_BUCKET || 'nila-media-uploads-prod';
        const downloadUrl = await getPresignedDownloadUrl({
          Bucket: bucket,
          Key: voice.sampleAudioS3Key,
          expiresInSeconds: 86400, // 24 hours
        });
        return {
          ...voice,
          previewAudioUrl: downloadUrl,
        };
      } catch (err: any) {
        logger.warn(`⚠️ [VoiceService] Failed to generate presigned download URL for key=${voice.sampleAudioS3Key}: ${err.message}`);
      }
    }
    return voice;
  }

  async getVoices(userId: string): Promise<IVoiceProfileSchema[]> {
    const list = await voiceProfileDao.getVoicesByUserId(userId);
    return await Promise.all(list.map((v) => this.attachPresignedUrl(v)));
  }

  async getVoice(voiceId: string, provider?: string): Promise<IVoiceProfileSchema> {
    const voice = await voiceProfileDao.getVoice(voiceId, provider);
    if (!voice) {
      throw new NotFoundError(`Voice profile ${voiceId}${provider ? ` (${provider})` : ''} not found`);
    }
    return await this.attachPresignedUrl(voice);
  }

  async deleteVoice(voiceId: string, provider?: string): Promise<void> {
    await voiceProfileDao.deleteVoice(voiceId, provider);
    logger.info(`🎤 [VoiceService] Deleted voice profile ${voiceId}${provider ? ` (${provider})` : ''}`);
  }
}

export default new VoiceService();
