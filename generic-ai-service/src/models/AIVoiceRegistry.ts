export interface IAIVoiceRegistrySchema {
  aiVoiceId: string;
  ownerProject: string;
  externalReferenceId: string;
  displayName: string;
  provider: 'elevenlabs' | 'cartesia' | 'mock';
  providerVoiceId: string;
  sampleAudioUrls: string[];
  status: 'READY' | 'TRAINING' | 'FAILED';
  previewAudioUrl?: string;
  createdAt: string;
  updatedAt: string;
}
