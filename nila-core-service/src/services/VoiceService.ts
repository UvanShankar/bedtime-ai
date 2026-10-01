import voiceProfileDao from '../dao/VoiceProfileDao';
import aiServiceClient from './AIServiceClient';
import { IVoiceProfileSchema } from '../models/VoiceProfile';
import { IRegisterVoiceDTO } from '../types';
import { generateId } from '../utils';
import { getPresignedUploadUrl } from '../database/s3Operations';
import { ValidationError, NotFoundError } from '../exceptions/ApiError';

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

    const voice: IVoiceProfileSchema = {
      voiceId,
      userId,
      displayName: dto.displayName,
      relationship: dto.relationship || 'Appa',
      sampleAudioS3Key: dto.sampleAudioS3Key,
      sampleDurationSeconds: dto.sampleDurationSeconds,
      consentVerified: true,
      status: 'PROCESSING',
      isDefault: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await voiceProfileDao.createVoice(voice);

    // Call Generic AI Service in background to train / register clone
    setImmediate(async () => {
      try {
        const bucket = process.env.UPLOADS_BUCKET || 'nila-media-uploads-prod';
        const sampleUrl = `https://${bucket}.s3.amazonaws.com/${dto.sampleAudioS3Key}`;

        const cloneResult = await aiServiceClient.cloneVoice({
          ownerProject: 'nila',
          externalReferenceId: voiceId,
          sampleAudioUrls: [sampleUrl],
          displayName: dto.displayName,
        });

        await voiceProfileDao.updateVoiceStatus(
          voiceId,
          'READY',
          cloneResult.previewAudioUrl,
          cloneResult.aiVoiceId
        );
      } catch (err: any) {
        console.error(`[VoiceService] Failed to train voice ${voiceId}:`, err);
        await voiceProfileDao.updateVoiceStatus(voiceId, 'FAILED');
      }
    });

    return voice;
  }

  async getVoices(userId: string): Promise<IVoiceProfileSchema[]> {
    return await voiceProfileDao.getVoicesByUserId(userId);
  }

  async getVoice(voiceId: string): Promise<IVoiceProfileSchema> {
    const voice = await voiceProfileDao.getVoice(voiceId);
    if (!voice) {
      throw new NotFoundError(`Voice profile ${voiceId} not found`);
    }
    return voice;
  }
}

export default new VoiceService();
