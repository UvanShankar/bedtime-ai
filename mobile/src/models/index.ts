export interface ParentProfile {
  id: string;
  name: string;
  relationship: "mother" | "father" | "grandparent" | "guardian" | "other" | string;
  language: string;
  languageCode: string;
  dialect?: string;
  script?: string;
  preferredChildName?: string;
  styleProfileId?: string;
  voiceProfileId?: string;
  createdAt: string;
  updatedAt: string;
}

export type Parent = ParentProfile;

export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  age: number;
  interests: string[];
  personality: string[];
  avoidTopics: string[];
  bedtimeAvoidances?: string[];
  favoriteCharacters?: string[];
  createdAt: string;
  updatedAt: string;
}

export type Child = ChildProfile;

export interface VoiceProfile {
  id: string;
  parentId: string;
  provider: string;
  providerVoiceId: string;
  sourceAudioKey: string;
  languageCode: string;
  status: "pending" | "processing" | "ready" | "failed";
  consentAccepted: boolean;
  accentDialect?: string;
  sampleDuration?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentStyleProfile {
  id: string;
  parentId: string;
  calmingLevel: number; // 0 to 1
  adventureDepth: number; // 0 to 1
  fantasyMagic: number; // 0 to 1
  pacingSpeed: number; // 0 to 1
  vocabularyLevel: number; // 0 to 1
  favoriteWords: string[];
  summaryText: string;
  updatedAt: string;
}

export interface LifeMemory {
  id: string;
  parentId: string;
  childId: string;
  title: string;
  category?: string;
  description: string;
  date?: string;
  people?: string[];
  location?: string;
  emotions?: string[];
  imageUrl?: string;
  useInStories: boolean;
  timesUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface StorySegment {
  id: string;
  order: number;
  text: string;
  emotion?: string;
  pace?: string;
  energy?: string;
  pauseBeforeMs?: number;
  pauseAfterMs?: number;
  emphasis?: string[];
}

export interface Story {
  id: string;
  requestId: string;
  parentId: string;
  childId: string;
  title: string;
  languageCode: string;
  summary?: string;
  text: string;
  segments: StorySegment[];
  narrationVersion: string;
  audioStatus: "pending" | "processing" | "ready" | "failed";
  audioKey?: string;
  audioUrl?: string;
  audioDurationSeconds?: number;
  audioError?: string;
  ttsProvider?: string;
  narratorName?: string;
  narratorStyle?: string;
  inspiredByMemory?: string;
  isFavorite?: boolean;
  createdAt: string;
}

export type AudioSource =
  | {
      type: "file";
      url: string;
    }
  | {
      type: "stream";
      streamUrl: string;
    };

export interface StoryRequestInput {
  parentId: string;
  childId: string;
  topic: string;
  storyType: string;
  mood: string;
  durationMinutes: number;
  educationalGoal?: string | null;
  bedtimeCalmness: number;
  includeChildName: boolean;
  includeFavoriteThings?: boolean;
  includeFamilyMembers?: boolean;
  includeLifeMemories?: boolean;
  realWorldFacts?: boolean;
  selectedMemoryIds?: string[];
  additionalInstruction?: string;
}

export interface UserSettings {
  sleepTimerMinutes: number;
  autoPlayNext: boolean;
  highFidelityAudio: boolean;
  anonymizeVoice: boolean;
  historyRetentionDays: number;
  driftModeDefault: boolean;
}
