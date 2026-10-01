import { ITTSProvider } from '../providers/tts/ITTSProvider';
import { ElevenLabsProvider } from '../providers/tts/ElevenLabsProvider';
import { MockTTSProvider } from '../providers/tts/MockTTSProvider';
import { ISpeechSynthesizeDTO, ISpeechSynthesizeResult } from '../types';
import { uploadBufferToS3 } from '../database/s3Operations';
import { v4 as uuidv4 } from 'uuid';

export class TTSService {
  private providers: Map<string, ITTSProvider> = new Map();

  constructor() {
    this.registerProvider(new ElevenLabsProvider());
    this.registerProvider(new MockTTSProvider());
  }

  public registerProvider(provider: ITTSProvider) {
    this.providers.set(provider.name, provider);
  }

  private getProvider(): ITTSProvider {
    if (process.env.ELEVENLABS_API_KEY && this.providers.has('elevenlabs')) {
      return this.providers.get('elevenlabs')!;
    }
    return this.providers.get('mock')!;
  }

  async synthesizeSpeech(params: ISpeechSynthesizeDTO): Promise<ISpeechSynthesizeResult> {
    const provider = this.getProvider();
    const { audioBuffer, durationSeconds } = await provider.synthesizeSpeech(params);

    const bucket = params.targetBucket || process.env.STORY_AUDIO_BUCKET || process.env.AI_SPEECH_BUCKET || 'generic-ai-speech-output-prod';
    const key = params.targetKey || `speech/${uuidv4()}.${params.outputFormat || 'mp3'}`;

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
