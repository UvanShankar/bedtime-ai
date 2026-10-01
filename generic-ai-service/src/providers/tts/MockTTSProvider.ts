import { ITTSProvider } from './ITTSProvider';
import { ISpeechSynthesizeDTO, IVoiceCloneDTO, IVoiceCloneResult } from '../../types';

export class MockTTSProvider implements ITTSProvider {
  public name = 'mock';

  async synthesizeSpeech(params: ISpeechSynthesizeDTO): Promise<{ audioBuffer: Buffer; durationSeconds: number }> {
    // Return a minimal valid MPEG audio frame (silence)
    const dummyMp3Header = Buffer.from([
      0xFF, 0xFB, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);

    const words = params.text.split(/\s+/).length;
    const durationSeconds = Math.max(10, Math.round((words / 120) * 60));

    return {
      audioBuffer: dummyMp3Header,
      durationSeconds,
    };
  }

  async cloneVoice(params: IVoiceCloneDTO): Promise<IVoiceCloneResult> {
    return {
      aiVoiceId: `mock_voice_${Date.now()}`,
      provider: 'mock',
      providerVoiceId: `mock_pv_${Date.now()}`,
      status: 'READY',
      previewAudioUrl: 'https://cdn.ai.app/preview_mock.mp3',
    };
  }
}
