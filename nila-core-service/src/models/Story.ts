export interface IStorySchema {
  storyId: string;
  userId: string;
  childId: string;
  voiceId?: string;
  title: string;
  theme: string;
  targetDurationMinutes: number;
  moralLesson?: string;
  includedMemoryIds: string[];
  language: string;
  dialect: string;
  status: 'QUEUED' | 'GENERATING_SCRIPT' | 'SYNTHESIZING_VOICE' | 'READY' | 'FAILED';
  progressPercent: number;
  stageMessage?: string;
  storyScript?: string;
  audioS3Key?: string;
  audioUrl?: string;
  audioDurationSeconds?: number;
  backgroundMusicTrack?: string;
  coverImageUrl?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}
