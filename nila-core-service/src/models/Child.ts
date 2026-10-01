export interface IChildSchema {
  childId: string;
  userId: string;
  name: string;
  gender: 'boy' | 'girl' | 'unspecified';
  age: number;
  avatarUrl?: string;
  bedtimeHour: number;
  bedtimeMinute: number;
  interests: string[];
  fearsToAvoid: string[];
  favoriteCharacters: string[];
  storySettings: {
    tamilDialect: 'Standard' | 'Chennai' | 'Kongu' | 'Madurai';
    slangLevel: 'natural' | 'minimal';
    bedtimePacing: 'gentle_slowdown' | 'playful_then_sleep';
  };
  createdAt: string;
  updatedAt: string;
}
