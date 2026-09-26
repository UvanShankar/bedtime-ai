export interface ParentProfile {
  id: string;
  name: string;
  relationship: "mother" | "father" | "grandparent" | "guardian" | "other";
  language: string;
  languageCode: string;
  dialect?: string;
  script?: string;
  styleProfileId?: string;
  voiceProfileId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  age: number;
  interests: string[];
  personality: string[];
  avoidTopics: string[];
  favoriteCharacters?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VoiceProfile {
  id: string;
  parentId: string;
  provider: string;
  providerVoiceId: string;
  sourceAudioKey: string;
  languageCode: string;
  status: "pending" | "processing" | "ready" | "failed";
  consentAccepted: boolean;
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
  ttsProvider?: string;
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
  realWorldFacts: boolean;
  additionalInstruction?: string;
}
