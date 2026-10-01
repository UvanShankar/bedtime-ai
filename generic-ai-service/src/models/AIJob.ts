export interface IAIJobSchema {
  jobId: string;
  jobType: 'STORY_PIPELINE' | 'TEXT_GEN' | 'TTS_ONLY' | 'VOICE_CLONE';
  ownerProject: string;
  externalReferenceId: string;
  requestPayload: Record<string, any>;
  resultPayload?: Record<string, any>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progressPercent: number;
  stageMessage?: string;
  errorMessage?: string;
  tokensConsumed?: number;
  audioSecondsGenerated?: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: number;
}
