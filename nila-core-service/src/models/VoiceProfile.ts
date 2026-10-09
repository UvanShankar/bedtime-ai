export interface IVoiceProfileSchema {
  voiceId: string;
  provider: string; // 'sarvam' | 'elevenlabs' | 'mock'
  voiceProvider?: string; // alias for provider
  userId: string;
  displayName: string;
  relationship?: string; // 'Appa', 'Amma', etc.
  sampleAudioS3Key: string;
  sampleDurationSeconds: number;
  consentVerified: boolean;
  aiServiceVoiceId?: string;
  providerVoiceId?: string;
  status: 'RECORDED' | 'PROCESSING' | 'READY' | 'FAILED';
  statusReason?: string;
  previewAudioUrl?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
