import { SarvamTTSProvider } from '../providers/tts/SarvamTTSProvider';
import { ElevenLabsProvider } from '../providers/tts/ElevenLabsProvider';
import { MockTTSProvider } from '../providers/tts/MockTTSProvider';
import { ITTSProvider } from '../providers/tts/ITTSProvider';
import { IVoiceCloneDTO, IVoiceCloneResult } from '../types';
import aiVoiceRegistryDao from '../dao/AIVoiceRegistryDao';
import { uploadBufferToS3, getPresignedUploadUrl } from '../database/s3Operations';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import logger from '../logger';

export class VoiceCloneService {
  private getProvider(preferred?: string): ITTSProvider {
    const key = preferred ? preferred.toLowerCase().trim() : undefined;
    let selected: ITTSProvider;
    if (key === 'sarvam') {
      selected = new SarvamTTSProvider();
    } else if (key === 'elevenlabs') {
      selected = new ElevenLabsProvider();
    } else if (key === 'mock') {
      selected = new MockTTSProvider();
    } else if (process.env.SARVAM_API_KEY) {
      selected = new SarvamTTSProvider();
    } else if (process.env.ELEVENLABS_API_KEY) {
      selected = new ElevenLabsProvider();
    } else {
      selected = new MockTTSProvider();
    }

    logger.debug(`[VoiceCloneService] Selected provider: "${selected.name}" (requested preferred: ${preferred ? `"${preferred}"` : 'none'})`);
    return selected;
  }

  async cloneVoice(params: IVoiceCloneDTO): Promise<IVoiceCloneResult> {
    const requestedProvider = params.provider || (params as any).voiceProvider;
    const provider = this.getProvider(requestedProvider);
    logger.info(`ðŸŽ¤ [VoiceCloneService] Initiating voice clone via provider=${provider.name}, name="${params.displayName || 'unnamed'}", samples=${params.sampleAudioUrls?.length || 0}`);
    const cloneResult = await provider.cloneVoice({ ...params, provider: provider.name });
    const finalProviderVoiceId = cloneResult.providerVoiceId || cloneResult.aiVoiceId;
    const aiVoiceId = finalProviderVoiceId || uuidv4();
    const timestamp = new Date().toISOString();

    logger.info(`ðŸ’¾ [VoiceCloneService] Persisting cloned voice in DynamoDB: aiVoiceId=${aiVoiceId}, providerVoiceId=${finalProviderVoiceId}, extRef=${params.externalReferenceId || 'none'}`);

    await aiVoiceRegistryDao.createVoice({
      aiVoiceId,
      voiceId: aiVoiceId,
      ownerProject: params.ownerProject,
      externalReferenceId: params.externalReferenceId,
      displayName: params.displayName || 'Cloned Voice',
      provider: cloneResult.provider as any,
      voiceProvider: cloneResult.provider,
      providerVoiceId: finalProviderVoiceId,
      sampleAudioUrls: params.sampleAudioUrls,
      status: cloneResult.status,
      previewAudioUrl: cloneResult.previewAudioUrl,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return {
      aiVoiceId,
      voiceId: aiVoiceId,
      provider: cloneResult.provider,
      voiceProvider: cloneResult.provider,
      providerVoiceId: finalProviderVoiceId,
      status: cloneResult.status,
      previewAudioUrl: cloneResult.previewAudioUrl,
    } as any;
  }

  async uploadSampleAudio(params: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    ownerProject?: string;
    externalReferenceId?: string;
  }): Promise<{
    sampleAudioUrl: string;
    audioS3Key: string;
    bucket: string;
    fileName: string;
    size: number;
    mimeType: string;
  }> {
    const bucket =
      process.env.MEDIA_UPLOADS_BUCKET ||
      process.env.STORY_AUDIO_BUCKET ||
      process.env.AI_SPEECH_BUCKET ||
      'nila-media-uploads-prod-354953409985';

    const ext = path.extname(params.fileName) || '.wav';
    const key = `voice-samples/${params.ownerProject || 'general'}/${uuidv4()}${ext}`;

    const sampleAudioUrl = await uploadBufferToS3({
      Bucket: bucket,
      Key: key,
      Body: params.buffer,
      ContentType: params.mimeType,
    });

    return {
      sampleAudioUrl,
      audioS3Key: key,
      bucket,
      fileName: params.fileName,
      size: params.buffer.length,
      mimeType: params.mimeType,
    };
  }

  async getPresignedSampleUploadUrl(params: {
    fileName: string;
    contentType?: string;
    ownerProject?: string;
  }): Promise<{
    uploadUrl: string;
    downloadUrl: string;
    audioS3Key: string;
    bucket: string;
  }> {
    const bucket =
      process.env.MEDIA_UPLOADS_BUCKET ||
      process.env.STORY_AUDIO_BUCKET ||
      process.env.AI_SPEECH_BUCKET ||
      'nila-media-uploads-prod-354953409985';

    const ext = path.extname(params.fileName) || '.wav';
    const key = `voice-samples/${params.ownerProject || 'general'}/${uuidv4()}${ext}`;
    const contentType = params.contentType || 'audio/wav';

    const uploadUrl = await getPresignedUploadUrl({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const region = process.env.AWS_REGION || 'ap-south-1';
    const downloadUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return {
      uploadUrl,
      downloadUrl,
      audioS3Key: key,
      bucket,
    };
  }
}

export default new VoiceCloneService();
