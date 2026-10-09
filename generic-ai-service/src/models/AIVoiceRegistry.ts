export interface IAIVoiceRegistrySchema {
  aiVoiceId: string;
  provider: 'sarvam' | 'elevenlabs' | 'cartesia' | 'mock' | string;
  voiceProvider?: string;
  voiceId?: string;
  ownerProject: string;
  externalReferenceId: string;
  displayName: string;
  providerVoiceId: string;
  sampleAudioUrls: string[];
  status: 'READY' | 'TRAINING' | 'FAILED';
  previewAudioUrl?: string;
  createdAt: string;
  updatedAt: string;
}
