export interface IResponse<Data, ErrorType = null> {
  data: Data;
  success: boolean;
  statusCode: number;
  error: ErrorType | null;
}

export interface IAuthResponse {
  user: {
    userId: string;
    fullName: string;
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
  fullName: string;
  mobile?: string;
  email?: string;
  password?: string;
  relationship?: 'Appa' | 'Amma' | 'Paati' | 'Thatha' | 'Other';
}

export interface ILoginDTO {
  emailOrMobile: string;
  password?: string;
}

export interface ICreateChildDTO {
  name: string;
  gender?: 'boy' | 'girl' | 'unspecified';
  age: number;
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
}

export interface IRequestStoryDTO {
  childId: string;
  voiceId?: string;
  theme?: string; // 'space', 'animals', 'adventure', 'moral', 'bedtime_calm'
  targetDurationMinutes?: number;
  promptIdea?: string;
  moralLesson?: string;
  includeMemoryIds?: string[];
  language?: string;
  dialect?: string;
  slangLevel?: string;
  bedtimePacing?: string;
}
