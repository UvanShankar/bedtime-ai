import { ITTSProvider } from './ITTSProvider';
import { ISpeechSynthesizeDTO, IVoiceCloneDTO, IVoiceCloneResult } from '../../types';
import { ApiError } from '../../exceptions/ApiError';

const SARVAM_SUPPORTED_LANGUAGES: Record<string, string> = {
  'ta': 'ta-IN',
  'ta-in': 'ta-IN',
  'hi': 'hi-IN',
  'hi-in': 'hi-IN',
  'te': 'te-IN',
  'te-in': 'te-IN',
  'kn': 'kn-IN',
  'kn-in': 'kn-IN',
  'ml': 'ml-IN',
  'ml-in': 'ml-IN',
  'en': 'en-IN',
  'en-in': 'en-IN',
};

const VALID_SARVAM_SPEAKERS = [
  'anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun', 'hitesh', 'aditya', 'ritu', 'priya',
  'neha', 'rahul', 'pooja', 'rohan', 'simran', 'kavya', 'amit', 'dev', 'ishita', 'shreya',
  'ratan', 'varun', 'manan', 'sumit', 'roopa', 'kabir', 'aayan', 'shubh', 'ashutosh', 'advait',
  'anand', 'tanya', 'tarun', 'sunny', 'mani', 'gokul', 'vijay', 'shruti', 'suhani', 'mohit',
  'kavitha', 'rehan', 'soham', 'rupali', 'niharika'
];

export class SarvamTTSProvider implements ITTSProvider {
  public name = 'sarvam';
  private apiKey: string | undefined;
  private baseUrl = 'https://api.sarvam.ai';

  constructor() {
    this.apiKey = process.env.SARVAM_API_KEY;
  }

  async synthesizeSpeech(params: ISpeechSynthesizeDTO): Promise<{ audioBuffer: Buffer; durationSeconds: number }> {
    if (!this.apiKey) {
      if (process.env.NODE_ENV !== 'production') {
        // Safe offline fallback in development
        const silentMp3Header = Buffer.from([
          0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ]);
        return { audioBuffer: silentMp3Header, durationSeconds: 5 };
      }
      throw new ApiError('Sarvam API key is not configured in SARVAM_API_KEY');
    }

    const langKey = (params.languageCode || 'ta-IN').toLowerCase();
    const targetLanguageCode = SARVAM_SUPPORTED_LANGUAGES[langKey] || 'ta-IN';

    const isClonedVoice = typeof params.aiVoiceId === 'string' && params.aiVoiceId.startsWith('svc-');
    const speakerCandidate = (params.aiVoiceId || 'priya').toLowerCase();
    const speaker = VALID_SARVAM_SPEAKERS.includes(speakerCandidate) ? speakerCandidate : 'priya';

    // Respect Sarvam character chunk limits
    const maxChunkLength = isClonedVoice ? 900 : 480;
    const textChunks: string[] = [];

    if (params.text.length <= maxChunkLength) {
      textChunks.push(params.text);
    } else {
      const sentences = params.text.split(/(?<=[.?!])\s+/);
      let currentChunk = '';
      for (const sentence of sentences) {
        if ((currentChunk + ' ' + sentence).trim().length <= maxChunkLength) {
          currentChunk = (currentChunk + ' ' + sentence).trim();
        } else {
          if (currentChunk) textChunks.push(currentChunk);
          currentChunk = sentence.slice(0, maxChunkLength);
        }
      }
      if (currentChunk) textChunks.push(currentChunk);
    }

    const audioBuffers: Buffer[] = [];
    let totalDuration = 0;

    for (const chunk of textChunks) {
      let response: Response;

      if (isClonedVoice) {
        // Cloned Voice inference endpoint
        const formData = new FormData();
        formData.append('voice_id', params.aiVoiceId!);
        formData.append('text', chunk);
        formData.append('language_code', targetLanguageCode);
        formData.append('pace', String(params.speakingRate ?? 0.9));
        formData.append('output_audio_codec', 'mp3');

        response = await fetch(`${this.baseUrl}/voices/clone`, {
          method: 'POST',
          headers: {
            'api-subscription-key': this.apiKey,
          },
          body: formData,
        });
      } else {
        // Standard pre-trained Sarvam speaker endpoint
        response = await fetch(`${this.baseUrl}/text-to-speech`, {
          method: 'POST',
          headers: {
            'api-subscription-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: [chunk],
            target_language_code: targetLanguageCode,
            speaker,
            model: 'bulbul:v2',
            pace: params.speakingRate ?? 0.9,
            speech_sample_rate: 22050,
            enable_preprocessing: true,
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(`Sarvam TTS error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as any;
      const base64Audio = isClonedVoice ? data.audio : data.audios?.[0];

      if (!base64Audio) {
        throw new ApiError('Sarvam API returned empty audio data');
      }

      const buf = Buffer.from(base64Audio, 'base64');
      audioBuffers.push(buf);
      totalDuration += data.audio_duration ? Math.round(data.audio_duration) : Math.round(buf.length / (22050 * 2));
    }

    const finalBuffer = audioBuffers.length === 1 ? audioBuffers[0] : Buffer.concat(audioBuffers);
    return {
      audioBuffer: finalBuffer,
      durationSeconds: Math.max(1, totalDuration),
    };
  }

  async cloneVoice(params: IVoiceCloneDTO): Promise<IVoiceCloneResult> {
    if (!this.apiKey) {
      if (process.env.NODE_ENV !== 'production') {
        return {
          aiVoiceId: `svc_mock_${Date.now()}`,
          provider: this.name,
          providerVoiceId: `svc_${Date.now()}`,
          status: 'READY',
          previewAudioUrl: 'https://cdn.ai.app/preview_mock.mp3',
        };
      }
      throw new ApiError('Sarvam API key is not configured in SARVAM_API_KEY');
    }

    // Fetch sample audio from first URL if provided
    let audioBuffer: Buffer;
    if (params.sampleAudioUrls && params.sampleAudioUrls.length > 0) {
      const sampleUrl = params.sampleAudioUrls[0];
      const audioRes = await fetch(sampleUrl);
      if (!audioRes.ok) {
        throw new ApiError(`Failed to fetch sample audio for Sarvam voice cloning from ${sampleUrl}`);
      }
      const arrayBuf = await audioRes.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuf);
    } else {
      throw new ApiError('No sampleAudioUrls provided for Sarvam voice cloning');
    }

    const langKey = (params.language || 'ta-IN').toLowerCase();
    const targetLanguageCode = SARVAM_SUPPORTED_LANGUAGES[langKey] || 'ta-IN';

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/wav' });
    formData.append('file', blob, 'sample_voice.wav');
    formData.append('voice_name', params.displayName || `Parent_${Date.now()}`);
    formData.append('language_code', targetLanguageCode);

    const response = await fetch(`${this.baseUrl}/voices/create`, {
      method: 'POST',
      headers: {
        'api-subscription-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Sarvam voice cloning failed (${response.status}): ${errorText}`);
    }

    const resData = (await response.json()) as any;
    const voiceId = resData?.data?.voice_id || resData?.voice_id;

    if (!voiceId) {
      throw new ApiError('Sarvam did not return a voice_id from /voices/create');
    }

    return {
      aiVoiceId: voiceId,
      provider: this.name,
      providerVoiceId: voiceId,
      status: 'READY',
      previewAudioUrl: resData?.data?.preview_url,
    };
  }
}
