export interface IResponse<Data, ErrorType = null> {
  data: Data;
  success: boolean;
  statusCode: number;
  error: ErrorType | null;
}

export type LLMProviderType = 'gemini' | 'openai' | 'claude' | 'mock';
export type TTSProviderType = 'elevenlabs' | 'cartesia' | 'polly' | 'mock';

export interface ITextGenerateDTO {
  provider?: LLMProviderType;
  model?: string;
  systemInstruction?: string;
  prompt: string;
  templateVariables?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
}

export interface ITextGenerateResult {
  text: string;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface IStructuredGenerateDTO<T = any> extends ITextGenerateDTO {
  jsonSchema: Record<string, any>;
}

export interface ISpeechSynthesizeDTO {
  text: string;
  aiVoiceId?: string;
  languageCode?: string; // e.g. "ta-IN", "en-US"
  speakingRate?: number;
  emotion?: string; // "bedtime_calm", "joyful", "whisper"
  ambientMusic?: {
    trackId: string;
    volumeDuckLevel?: number;
  };
  outputFormat?: 'mp3' | 'wav';
  targetBucket?: string;
  targetKey?: string;
}

export interface ISpeechSynthesizeResult {
  audioS3Key: string;
  audioUrl: string;
  durationSeconds: number;
  format: string;
  provider: string;
}

export interface IVoiceCloneDTO {
  ownerProject: string; // e.g. "nila", "purpleone"
  externalReferenceId: string; // e.g. "voc_123"
  sampleAudioUrls: string[];
  displayName?: string;
  speakerGender?: 'male' | 'female' | 'unspecified';
  language?: string;
}

export interface IVoiceCloneResult {
  aiVoiceId: string;
  provider: string;
  providerVoiceId: string;
  status: 'READY' | 'TRAINING' | 'FAILED';
  previewAudioUrl?: string;
}

export interface IAIPipelineJobDTO {
  jobType: 'STORY_PIPELINE' | 'TEXT_GEN' | 'TTS_ONLY' | 'VOICE_CLONE';
  ownerProject: string;
  externalReferenceId: string;
  payload: Record<string, any>;
  callbackWebhookUrl?: string;
}

export interface IAIJobResult {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progressPercent: number;
  result?: Record<string, any>;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface IChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface IChatGPTRequestDTO {
  text?: string;
  prompt?: string;
  messages?: IChatMessage[];
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  allowMockFallback?: boolean;
}

export interface IChatGPTResponseDTO {
  inputText: string;
  outputText: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}
