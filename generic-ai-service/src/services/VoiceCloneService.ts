import { SarvamTTSProvider } from '../providers/tts/SarvamTTSProvider';
import { ElevenLabsProvider } from '../providers/tts/ElevenLabsProvider';
import { MockTTSProvider } from '../providers/tts/MockTTSProvider';
import { ITTSProvider } from '../providers/tts/ITTSProvider';
import { IVoiceCloneDTO, IVoiceCloneResult } from '../types';
import aiVoiceRegistryDao from '../dao/AIVoiceRegistryDao';
import { v4 as uuidv4 } from 'uuid';

export class VoiceCloneService {
  private getProvider(preferred?: string): ITTSProvider {
    let selected: ITTSProvider;
    if (preferred === 'sarvam' || (process.env.SARVAM_API_KEY && preferred !== 'elevenlabs')) {
      selected = new SarvamTTSProvider();
    } else if (process.env.ELEVENLABS_API_KEY) {
      selected = new ElevenLabsProvider();
    } else if (process.env.SARVAM_API_KEY) {
      selected = new SarvamTTSProvider();
    } else {
      selected = new MockTTSProvider();
    }

    console.log(`[VoiceCloneService] Selected provider: "${selected.name}" (requested preferred: ${preferred ? `"${preferred}"` : 'none'})`);
    return selected;
  }

  async cloneVoice(params: IVoiceCloneDTO): Promise<IVoiceCloneResult> {
    const provider = this.getProvider();
    const cloneResult = await provider.cloneVoice(params);
    const aiVoiceId = uuidv4();
    const timestamp = new Date().toISOString();

    await aiVoiceRegistryDao.createVoice({
      aiVoiceId,
      ownerProject: params.ownerProject,
      externalReferenceId: params.externalReferenceId,
      displayName: params.displayName || 'Cloned Voice',
      provider: cloneResult.provider as any,
      providerVoiceId: cloneResult.providerVoiceId,
      sampleAudioUrls: params.sampleAudioUrls,
      status: cloneResult.status,
      previewAudioUrl: cloneResult.previewAudioUrl,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return {
      aiVoiceId,
      provider: cloneResult.provider,
      providerVoiceId: cloneResult.providerVoiceId,
      status: cloneResult.status,
      previewAudioUrl: cloneResult.previewAudioUrl,
    };
  }
}

export default new VoiceCloneService();
