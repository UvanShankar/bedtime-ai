export interface IResponse<Data, ErrorType = null> {
  data: Data;
  success: boolean;
  statusCode: number;
  error: ErrorType | null;
}

export interface IAuthResponse {
  user: {
    userId: string;
    fullName?: string;
    mobile?: string;
    email?: string;
    relationship?: string;
    isVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ITokenPayload {
  userId: string;
  mobile?: string;
  email?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: ITokenPayload;
      userId?: string;
    }
  }
}

export interface ISignupDTO {
  fullName?: string;
  mobile?: string;
  phoneNumber?: string;
  otp?: string;
  email?: string;
  password?: string;
  relationship?: 'Appa' | 'Amma' | 'Paati' | 'Thatha' | 'Other';
}

export interface ILoginDTO {
  emailOrMobile?: string;
  mobile?: string;
  phoneNumber?: string;
  otp?: string;
  password?: string;
}

export interface ISendOtpDTO {
  mobile?: string;
  phoneNumber?: string;
}

export interface IVerifyOtpDTO {
  mobile?: string;
  phoneNumber?: string;
  otp: string;
  fullName?: string;
  relationship?: 'Appa' | 'Amma' | 'Paati' | 'Thatha' | 'Other';
}

export interface ICreateChildDTO {
  name: string;
  gender?: 'boy' | 'girl' | 'unspecified';
  age: number;
  avatarUrl?: string;
  bedtimeHour?: number;
  bedtimeMinute?: number;
  interests?: string[];
  fearsToAvoid?: string[];
  favoriteCharacters?: string[];
  storySettings?: {
    tamilDialect?: 'Standard' | 'Chennai' | 'Kongu' | 'Madurai';
    slangLevel?: 'natural' | 'minimal';
    bedtimePacing?: 'gentle_slowdown' | 'playful_then_sleep';
  };
}

export interface ICreateMemoryDTO {
  childId?: string;
  title: string;
  description: string;
  eventDate?: string;
  photoUrl?: string;
  tags?: string[];
}

export interface IRegisterVoiceDTO {
  displayName: string;
  relationship: string;
  sampleAudioS3Key: string;
  sampleDurationSeconds: number;
  consentAffirmed: boolean;
  provider?: string; // 'sarvam' | 'elevenlabs' | 'mock'
  voiceProvider?: string; // alias for provider
}

export interface IRequestStoryDTO {
  childId: string;
  relationship?: string;
  voiceId?: string;
  theme?: string; // 'space', 'animals', 'adventure', 'moral', 'bedtime_calm'
  mood?: string; // 'Warm & Funny', 'Gentle & Sleepy', 'Cozy', 'Magical', 'Peaceful', 'Playful'
  targetDurationMinutes?: number;
  bedtimeCalmness?: number; // 0.0 (Playful) to 1.0 (Very Sleepy)
  includeChildName?: boolean;
  includeFavoriteThings?: boolean;
  includeFamilyMembers?: boolean;
  includeLifeMemories?: boolean;
  promptIdea?: string;
  moralLesson?: string;
  includeMemoryIds?: string[];
  additionalInstruction?: string;
  language?: string;
  dialect?: string;
  slangLevel?: string;
  bedtimePacing?: string;
  model?: string;
  llmProvider?: string;
  ttsProvider?: string;
  provider?: string;
  voiceProvider?: string;
  speaker?: string;
  voiceName?: string;
  speakingRate?: number;
  maxTokens?: number;
}
