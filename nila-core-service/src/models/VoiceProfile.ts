export interface IVoiceProfileSchema {
  voiceId: string;
  userId: string;
  displayName: string;
  relationship: string; // 'Appa', 'Amma', etc.
  sampleAudioS3Key: string;
  sampleDurationSeconds: number;
  consentVerified: boolean;
  aiServiceVoiceId?: string;
  status: 'RECORDED' | 'PROCESSING' | 'READY' | 'FAILED';
  statusReason?: string;
  previewAudioUrl?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
