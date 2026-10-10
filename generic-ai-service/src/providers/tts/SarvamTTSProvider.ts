import { ITTSProvider } from './ITTSProvider';
import { ISpeechSynthesizeDTO, IVoiceCloneDTO, IVoiceCloneResult } from '../../types';
import { ApiError } from '../../exceptions/ApiError';
import { getBufferFromUrlOrS3 } from '../../database/s3Operations';
import logger from '../../logger';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

async function transcodeToWav(inputBuffer: Buffer, extHint: string = 'm4a'): Promise<Buffer> {
  const tmpId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const tmpIn = path.join(os.tmpdir(), `sarvam_in_${tmpId}.${extHint}`);
  const tmpOut = path.join(os.tmpdir(), `sarvam_out_${tmpId}.wav`);

  try {
    await fs.promises.writeFile(tmpIn, inputBuffer);
    await execFileAsync('ffmpeg', [
      '-y',
      '-i', tmpIn,
      '-ar', '24000',
      '-ac', '1',
      '-c:a', 'pcm_s16le',
      tmpOut,
    ]);
    const wavBuffer = await fs.promises.readFile(tmpOut);
    logger.info(`🎤 [SarvamTTSProvider] Transcoded audio sample to 24kHz mono WAV: ${inputBuffer.length} bytes -> ${wavBuffer.length} bytes`);
    return wavBuffer;
  } finally {
    await Promise.all([
      fs.promises.unlink(tmpIn).catch(() => {}),
      fs.promises.unlink(tmpOut).catch(() => {}),
    ]);
  }
}

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

    const candidateLower = (typeof rawSpeaker === 'string' ? rawSpeaker.trim().toLowerCase() : '');
    const isBuiltInSpeaker = VALID_SARVAM_SPEAKERS.includes(candidateLower);
    const isClonedVoice = Boolean(
      params.aiVoiceId ||
      (!isBuiltInSpeaker && rawSpeaker && rawSpeaker.trim().length > 0)
    );
    const effectiveSpeaker = isClonedVoice
      ? (params.aiVoiceId || rawSpeaker)
      : (isBuiltInSpeaker ? candidateLower : 'priya');

    logger.info(`🎙️ [SarvamTTSProvider] Speech synthesis config: rawSpeaker="${rawSpeaker}", effectiveSpeaker="${effectiveSpeaker}", isCloned=${isClonedVoice}, targetLanguage="${targetLanguageCode}"`);

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

    logger.info(`[SarvamTTSProvider] Synthesizing ${textChunks.length} text chunks in parallel (speaker=${effectiveSpeaker}, cloned=${isClonedVoice})`);
    const chunkPromises = textChunks.map(async (chunk, index) => {
      logger.info(`[SarvamTTSProvider] Requesting audio chunk ${index + 1}/${textChunks.length} (${chunk.length} chars)`);
      let response: Response;

      if (isClonedVoice) {
        // Cloned Voice inference endpoint
        const formData = new FormData();
        formData.append('voice_id', effectiveSpeaker!);
        formData.append('text', chunk);
        formData.append('language_code', targetLanguageCode);
        formData.append('pace', String(params.speakingRate ?? 0.9));
        formData.append('output_audio_codec', 'mp3');

        response = await fetch(`${this.baseUrl}/voices/clone`, {
          method: 'POST',
          headers: {
            'api-subscription-key': this.apiKey!,
          },
          body: formData,
        });
      } else {
        // Standard pre-trained Sarvam speaker endpoint
        response = await fetch(`${this.baseUrl}/text-to-speech`, {
          method: 'POST',
          headers: {
            'api-subscription-key': this.apiKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: chunk,
            language_code: targetLanguageCode,
            speaker: effectiveSpeaker,
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
      const duration = data.audio_duration ? Math.round(data.audio_duration) : Math.round(buf.length / (22050 * 2));
      return { index, buf, duration };
    });

    const chunkResults = await Promise.all(chunkPromises);
    chunkResults.sort((a, b) => a.index - b.index);

    const audioBuffers = chunkResults.map(r => r.buf);
    const totalDuration = chunkResults.reduce((acc, r) => acc + r.duration, 0);

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
    const isWav =
      (audioBuffer.length >= 12 && audioBuffer.toString('ascii', 0, 4) === 'RIFF' && audioBuffer.toString('ascii', 8, 12) === 'WAVE') ||
      sampleUrl.includes('.wav');
    const isMp3 =
      sampleUrl.includes('.mp3') ||
      (audioBuffer.length >= 3 && audioBuffer[0] === 0x49 && audioBuffer[1] === 0x44 && audioBuffer[2] === 0x33);
    const isAac =
      sampleUrl.includes('.aac') ||
      (audioBuffer.length >= 2 && audioBuffer[0] === 0xff && (audioBuffer[1] & 0xf0) === 0xf0);
    const isM4a =
      sampleUrl.includes('.m4a') ||
      sampleUrl.includes('.mp4') ||
      (audioBuffer.length >= 8 && audioBuffer[4] === 0x66 && audioBuffer[5] === 0x74 && audioBuffer[6] === 0x79 && audioBuffer[7] === 0x70);

    let finalAudioBuffer = audioBuffer;
    let mimeType = 'audio/wav';
    let sampleFileName = 'sample_voice.wav';

    if (isWav) {
      mimeType = 'audio/wav';
      sampleFileName = 'sample_voice.wav';
    } else if (isAac) {
      // Direct AAC natively accepted by Sarvam!
      mimeType = 'audio/aac';
      sampleFileName = 'sample_voice.aac';
    } else if (isMp3) {
      // MP3 natively accepted by Sarvam!
      mimeType = 'audio/mpeg';
      sampleFileName = 'sample_voice.mp3';
    } else {
      // Non-standard container (e.g. M4A/MP4) - transcode to 24kHz mono WAV
      try {
        finalAudioBuffer = await transcodeToWav(audioBuffer, isM4a ? 'm4a' : 'bin');
        mimeType = 'audio/wav';
        sampleFileName = 'sample_voice.wav';
      } catch (err: any) {
        logger.warn(`⚠️ [SarvamTTSProvider] ffmpeg transcoding failed (${err.message}). Falling back to audio/aac.`);
        mimeType = 'audio/aac';
        sampleFileName = 'sample_voice.aac';
      }
    }

    const voiceName = (params.displayName || `Parent_${Date.now()}`).trim().slice(0, 100);

    logger.info(`🎤 [SarvamTTSProvider] Calling Sarvam /voices/create: name="${voiceName}", lang="${targetLanguageCode}", mimeType="${mimeType}", fileName="${sampleFileName}", bytes=${finalAudioBuffer.length}`);

    const formData = new FormData();
    const blob = new Blob([finalAudioBuffer], { type: mimeType });
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
