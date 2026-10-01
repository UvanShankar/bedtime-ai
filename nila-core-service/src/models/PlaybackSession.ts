export interface IPlaybackSessionSchema {
  sessionId: string;
  userId: string;
  storyId: string;
  childId?: string;
  lastPlayedPositionSeconds: number;
  isCompleted: boolean;
  playCount: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}
