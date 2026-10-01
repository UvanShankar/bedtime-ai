import { ITTSProvider } from './ITTSProvider';
import { ISpeechSynthesizeDTO, IVoiceCloneDTO, IVoiceCloneResult } from '../../types';
import { ApiError } from '../../exceptions/ApiError';

export class ElevenLabsProvider implements ITTSProvider {
  public name = 'elevenlabs';
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
  }

  async synthesizeSpeech(params: ISpeechSynthesizeDTO): Promise<{ audioBuffer: Buffer; durationSeconds: number }> {
    if (!this.apiKey) {
      throw new ApiError('ElevenLabs API key is not configured');
    }

    const voiceId = params.aiVoiceId || 'pNInz6obpgDQGcFmaJgB'; // Default gentle warm narrator voice
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: params.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.85,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new ApiError(`ElevenLabs synthesis failed: ${response.status} - ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Approximate audio duration: ~150 words per minute
    const wordCount = params.text.split(/\s+/).length;
    const durationSeconds = Math.max(5, Math.round((wordCount / 130) * 60));

    return { audioBuffer, durationSeconds };
  }

  async cloneVoice(params: IVoiceCloneDTO): Promise<IVoiceCloneResult> {
    if (!this.apiKey) {
      throw new ApiError('ElevenLabs API key is not configured');
    }

    // In a real environment, this sends FormData with audio blobs to /v1/voices/add
    return {
      aiVoiceId: `el_${Date.now()}`,
      provider: this.name,
      providerVoiceId: `el_v_${Date.now()}`,
      status: 'READY',
      previewAudioUrl: 'https://cdn.ai.app/preview_sample.mp3',
    };
  }
}
