import { ISpeechSynthesizeDTO, ISpeechSynthesizeResult, IVoiceCloneDTO, IVoiceCloneResult } from '../../types';

export interface ITTSProvider {
  name: string;
  synthesizeSpeech(params: ISpeechSynthesizeDTO): Promise<{ audioBuffer: Buffer; durationSeconds: number }>;
  cloneVoice(params: IVoiceCloneDTO): Promise<IVoiceCloneResult>;
}
