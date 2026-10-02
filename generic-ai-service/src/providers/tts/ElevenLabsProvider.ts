import { ITTSProvider } from './ITTSProvider';
import { ISpeechSynthesizeDTO, IVoiceCloneDTO, IVoiceCloneResult } from '../../types';
import { ApiError } from '../../exceptions/ApiError';
import { getBufferFromUrlOrS3 } from '../../database/s3Operations';

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

    const voiceId =
      params.speaker ||
      (Array.isArray(params.speakers) ? params.speakers[0] : params.speakers) ||
      params.aiVoiceId ||
      'pNInz6obpgDQGcFmaJgB'; // Default gentle warm narrator voice
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

    if (!params.sampleAudioUrls || params.sampleAudioUrls.length === 0) {
      throw new ApiError('No sampleAudioUrls provided for ElevenLabs voice cloning');
    }

    const sampleUrl = params.sampleAudioUrls[0];
    let audioBuffer: Buffer;
    try {
      audioBuffer = await getBufferFromUrlOrS3(sampleUrl);
    } catch (err: any) {
      throw new ApiError(`Failed to fetch sample audio for ElevenLabs voice cloning: ${err.message}`);
    }

    const isMp3 = sampleUrl.toLowerCase().includes('.mp3');
    const mimeType = isMp3 ? 'audio/mpeg' : 'audio/wav';
    const fileName = isMp3 ? 'sample_voice.mp3' : 'sample_voice.wav';
    const voiceName = (params.displayName || `Parent_${Date.now()}`).trim().slice(0, 100);

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append('files', blob, fileName);
    formData.append('name', voiceName);
    if (params.speakerGender) {
      formData.append('labels', JSON.stringify({ gender: params.speakerGender }));
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`ElevenLabs voice cloning failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as any;
    const voiceId = data.voice_id;

    if (!voiceId) {
      throw new ApiError('ElevenLabs did not return a voice_id from /v1/voices/add');
    }

    return {
      aiVoiceId: voiceId,
      provider: this.name,
      providerVoiceId: voiceId,
      status: 'READY',
      previewAudioUrl: data.preview_url,
    };
  }
}
