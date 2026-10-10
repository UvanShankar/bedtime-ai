import { ITTSProvider } from './ITTSProvider';
import { ISpeechSynthesizeDTO, IVoiceCloneDTO, IVoiceCloneResult } from '../../types';
import { ApiError } from '../../exceptions/ApiError';
import { getBufferFromUrlOrS3 } from '../../database/s3Operations';
import logger from '../../logger';

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
  'bn': 'bn-IN',
  'bn-in': 'bn-IN',
  'gu': 'gu-IN',
  'gu-in': 'gu-IN',
  'mr': 'mr-IN',
  'mr-in': 'mr-IN',
  'od': 'od-IN',
  'od-in': 'od-IN',
  'pa': 'pa-IN',
  'pa-in': 'pa-IN',
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

    const rawLang = params.languageCode || (params as any).language || 'ta-IN';
    const langKey = rawLang.toLowerCase();
    const targetLanguageCode = SARVAM_SUPPORTED_LANGUAGES[langKey] || rawLang;

    const rawSpeaker =
      params.speaker ||
      (Array.isArray(params.speakers) ? params.speakers[0] : params.speakers) ||
      params.aiVoiceId;
    const isClonedVoice = typeof rawSpeaker === 'string' && (rawSpeaker.startsWith('svc-') || rawSpeaker.startsWith('svc_'));
    const speakerCandidate = (rawSpeaker || 'priya').toLowerCase();
    const speaker = isClonedVoice ? rawSpeaker : (VALID_SARVAM_SPEAKERS.includes(speakerCandidate) ? speakerCandidate : 'priya');

    logger.info(`ðŸŽ™ï¸ [SarvamTTSProvider] Speech synthesis config: rawSpeaker="${rawSpeaker}", effectiveSpeaker="${speaker}", isCloned=${isClonedVoice}, targetLanguage="${targetLanguageCode}"`);

    // Respect Sarvam character chunk limits (bulbul:v3 supports up to 2500 characters)
    const maxChunkLength = isClonedVoice ? 900 : 2000;
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

    logger.info(`[SarvamTTSProvider] Synthesizing ${textChunks.length} text chunks (speaker=${speaker}, cloned=${isClonedVoice})`);
    let chunkIndex = 0;
    for (const chunk of textChunks) {
      chunkIndex++;
      logger.info(`[SarvamTTSProvider] Requesting audio chunk ${chunkIndex}/${textChunks.length} (${chunk.length} chars)`);
      let response: Response;

      if (isClonedVoice) {
        // Cloned Voice inference endpoint
        const formData = new FormData();
        formData.append('voice_id', rawSpeaker!);
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
            text: chunk,
            language_code: targetLanguageCode,
            speaker,
            model: 'bulbul:v3',
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

    // Fetch sample audio from first URL or S3 key if provided
    let audioBuffer: Buffer;
    if (params.sampleAudioUrls && params.sampleAudioUrls.length > 0) {
      const sampleUrl = params.sampleAudioUrls[0];
      try {
        logger.info(`[SarvamTTSProvider] Loading voice clone sample audio from "${sampleUrl}"...`);
        audioBuffer = await getBufferFromUrlOrS3(sampleUrl);
        logger.info(`[SarvamTTSProvider] Sample audio loaded successfully: ${audioBuffer.length} bytes`);
      } catch (err: any) {
        logger.error(`[SarvamTTSProvider] Failed to fetch sample audio for Sarvam voice cloning: ${err.message}`);
        throw new ApiError(`Failed to fetch sample audio for Sarvam voice cloning from ${sampleUrl}: ${err.message}`);
      }
    } else {
      throw new ApiError('No sampleAudioUrls provided for Sarvam voice cloning');
    }

    const rawLang = params.language || (params as any).languageCode || 'ta-IN';
    const langKey = rawLang.toLowerCase();
    const targetLanguageCode = SARVAM_SUPPORTED_LANGUAGES[langKey] || rawLang;

    // Detect format accurately from URL or binary magic numbers
    const sampleUrl = (params.sampleAudioUrls[0] || '').toLowerCase();
    const isMp3 = sampleUrl.includes('.mp3') ||
      (audioBuffer.length >= 3 && audioBuffer[0] === 0x49 && audioBuffer[1] === 0x44 && audioBuffer[2] === 0x33);
    const isM4a = sampleUrl.includes('.m4a') || sampleUrl.includes('.aac') || sampleUrl.includes('.mp4') ||
      (audioBuffer.length >= 8 && audioBuffer[4] === 0x66 && audioBuffer[5] === 0x74 && audioBuffer[6] === 0x79 && audioBuffer[7] === 0x70);

    let mimeType = 'audio/wav';
    let sampleFileName = 'sample_voice.wav';
    if (isM4a) {
      mimeType = 'audio/m4a';
      sampleFileName = 'sample_voice.m4a';
    } else if (isMp3) {
      mimeType = 'audio/mpeg';
      sampleFileName = 'sample_voice.mp3';
    }

    const voiceName = (params.displayName || `Parent_${Date.now()}`).trim().slice(0, 100);

    logger.info(`ðŸŽ¤ [SarvamTTSProvider] Calling Sarvam /voices/create: name="${voiceName}", lang="${targetLanguageCode}", mimeType="${mimeType}", fileName="${sampleFileName}", bytes=${audioBuffer.length}`);

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append('file', blob, sampleFileName);
    formData.append('name', voiceName);
    formData.append('voice_name', voiceName);
    formData.append('language', targetLanguageCode);
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
      logger.error(`âŒ [SarvamTTSProvider] Sarvam voice creation failed (${response.status}): ${errorText}`);
      throw new ApiError(`Sarvam voice cloning failed (${response.status}): ${errorText}`);
    }

    const resData = (await response.json()) as any;
    logger.info(`âœ… [SarvamTTSProvider] Sarvam /voices/create response: ${JSON.stringify(resData)}`);
    const voiceId = resData?.data?.voice_id || resData?.voice_id;

    if (!voiceId) {
      logger.error(`âŒ [SarvamTTSProvider] Sarvam response missing voice_id: ${JSON.stringify(resData)}`);
      throw new ApiError('Sarvam did not return a voice_id from /voices/create');
    }

    logger.info(`ðŸŽ‰ [SarvamTTSProvider] Voice clone created successfully: voiceId=${voiceId}`);

    return {
      aiVoiceId: voiceId,
      provider: this.name,
      providerVoiceId: voiceId,
      status: 'READY',
      previewAudioUrl: resData?.data?.preview_url,
    };
  }
}
