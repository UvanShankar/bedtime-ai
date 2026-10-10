import { ITTSProvider } from '../providers/tts/ITTSProvider';
import { SarvamTTSProvider } from '../providers/tts/SarvamTTSProvider';
import { ElevenLabsProvider } from '../providers/tts/ElevenLabsProvider';
import { MockTTSProvider } from '../providers/tts/MockTTSProvider';
import { ISpeechSynthesizeDTO, ISpeechSynthesizeResult } from '../types';
import { uploadBufferToS3 } from '../database/s3Operations';
import aiVoiceRegistryDao from '../dao/AIVoiceRegistryDao';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

export class TTSService {
  private providers: Map<string, ITTSProvider> = new Map();

  constructor() {
    this.registerProvider(new SarvamTTSProvider());
    this.registerProvider(new ElevenLabsProvider());
    this.registerProvider(new MockTTSProvider());
  }

  public registerProvider(provider: ITTSProvider) {
    this.providers.set(provider.name, provider);
  }

  private getProvider(preferred?: string): ITTSProvider {
    const key = preferred ? preferred.toLowerCase().trim() : undefined;
    let selected: ITTSProvider;
    if (key && this.providers.has(key)) {
      selected = this.providers.get(key)!;
    } else if (process.env.SARVAM_API_KEY && this.providers.has('sarvam')) {
      selected = this.providers.get('sarvam')!;
    } else if (process.env.ELEVENLABS_API_KEY && this.providers.has('elevenlabs')) {
      selected = this.providers.get('elevenlabs')!;
    } else {
      selected = this.providers.get('mock')!;
    }

    logger.debug(`[TTSService] Selected provider: "${selected.name}" (requested preferred: ${preferred ? `"${preferred}"` : 'none'})`);
    return selected;
  }

  async synthesizeSpeech(params: ISpeechSynthesizeDTO): Promise<ISpeechSynthesizeResult> {
    const resolvedParams = { ...params };
    const voiceCandidate = resolvedParams.speaker || resolvedParams.aiVoiceId;
    const providerCandidate = resolvedParams.provider || (resolvedParams as any).voiceProvider;

    const PRETRAINED_SARVAM_SPEAKERS = [
      'anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun', 'hitesh', 'aditya', 'ritu', 'priya',
      'neha', 'rahul', 'pooja', 'rohan', 'simran', 'kavya', 'amit', 'dev', 'ishita', 'shreya',
      'ratan', 'varun', 'manan', 'sumit', 'roopa', 'kabir', 'aayan', 'shubh', 'ashutosh', 'advait',
      'anand', 'tanya', 'tarun', 'sunny', 'mani', 'gokul', 'vijay', 'shruti', 'suhani', 'mohit',
      'kavitha', 'rehan', 'soham', 'rupali', 'niharika'
    ];

    const isPretrained = typeof voiceCandidate === 'string' && PRETRAINED_SARVAM_SPEAKERS.includes(voiceCandidate.toLowerCase());

    if (voiceCandidate && !voiceCandidate.startsWith('svc-') && !isPretrained) {
      try {
        let registered = await aiVoiceRegistryDao.getVoice(voiceCandidate, providerCandidate);
        if (!registered && (voiceCandidate.startsWith('voc_') || voiceCandidate.startsWith('voc-'))) {
          registered = await aiVoiceRegistryDao.getVoiceByExternalRef('nila', voiceCandidate);
        }
        if (registered && (registered.providerVoiceId || registered.aiVoiceId)) {
          const finalVoiceId = registered.providerVoiceId || registered.aiVoiceId;
          logger.info(`[TTSService] Resolved voiceCandidate "${voiceCandidate}" to registered provider voice "${finalVoiceId}" (${registered.provider})`);
          resolvedParams.speaker = finalVoiceId;
          resolvedParams.aiVoiceId = finalVoiceId;
          if (registered.provider) {
            resolvedParams.provider = registered.provider;
          }
        }
      } catch (err: any) {
        logger.warn(`[TTSService] Voice registry lookup note for "${voiceCandidate}": ${err.message}`);
      }
    } else if (voiceCandidate && voiceCandidate.startsWith('svc-') && !resolvedParams.provider) {
      resolvedParams.provider = 'sarvam';
    }

    const provider = this.getProvider(resolvedParams.provider);
    logger.info(`ðŸŽ™ï¸ [TTSService] Synthesizing speech via provider=${provider.name}, speaker=${resolvedParams.speaker || 'default'}, voiceId=${resolvedParams.aiVoiceId || 'none'}, textLen=${resolvedParams.text?.length || 0}`);
    const { audioBuffer, durationSeconds } = await provider.synthesizeSpeech(resolvedParams);

    const bucket = params.targetBucket || process.env.STORY_AUDIO_BUCKET || process.env.AI_SPEECH_BUCKET || 'generic-ai-speech-output-prod';
    const key = params.targetKey || `speech/${uuidv4()}.${params.outputFormat || 'mp3'}`;

    logger.debug(`â˜ï¸ [TTSService] Uploading synthesized audio (${audioBuffer.length} bytes) to S3 bucket=${bucket}, key=${key}`);
    const audioUrl = await uploadBufferToS3({
      Bucket: bucket,
      Key: key,
      Body: audioBuffer,
      ContentType: params.outputFormat === 'wav' ? 'audio/wav' : 'audio/mpeg',
    });

    return {
      audioS3Key: key,
      audioUrl,
      durationSeconds,
      format: params.outputFormat || 'mp3',
      provider: provider.name,
    };
  }
}

export default new TTSService();
