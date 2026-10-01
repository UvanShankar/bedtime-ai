export interface IMemorySchema {
  memoryId: string;
  userId: string;
  childId?: string;
  title: string;
  description: string;
  photoUrl?: string;
  eventDate?: string;
  tags: string[];
  wovenStoryCount: number;
  createdAt: string;
  updatedAt: string;
}
