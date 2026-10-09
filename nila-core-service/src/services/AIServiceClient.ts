import { ApiError } from '../exceptions/ApiError';
import logger from '../logger';

export class AIServiceClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8081';
    this.apiKey = process.env.AI_SERVICE_API_KEY || 'test-ai-key-secret-12345';
  }

  private async fetchAI(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const method = options.method || 'GET';
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...(options.headers || {}),
    };

    logger.debug(`🤖 [AIServiceClient] Dispatching ${method} ${url}`);
    const startTime = Date.now();
    try {
      const response = await fetch(url, { ...options, headers });
      const duration = Date.now() - startTime;
      if (!response.ok) {
        const errText = await response.text();
        logger.error(`❌ [AIServiceClient] Request failed ${method} ${path} (${response.status}) in ${duration}ms: ${errText}`);
        throw new ApiError(`AI Service error (${response.status}): ${errText}`);
      }

      logger.debug(`✅ [AIServiceClient] Success ${method} ${path} (${response.status}) in ${duration}ms`);
      const json = (await response.json()) as any;
      return json.data;
    } catch (err: any) {
      if (!(err instanceof ApiError)) {
        logger.error(`❌ [AIServiceClient] Network/connection error contacting ${url}: ${err.message}`);
      }
      throw err;
    }
  }

  async cloneVoice(params: {
    ownerProject: string;
    externalReferenceId: string;
    sampleAudioUrls: string[];
    displayName?: string;
    provider?: string;
    voiceProvider?: string;
  }): Promise<{ aiVoiceId: string; voiceId?: string; provider: string; voiceProvider?: string; providerVoiceId?: string; status: string; previewAudioUrl?: string }> {
    return await this.fetchAI('/api/v1/ai/voice/clone', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async submitStoryPipeline(params: {
    storyId: string;
    childName: string;
    promptIdea: string;
    systemInstruction: string;
    dialect: string;
    memorySnippet?: string;
    aiVoiceId?: string;
    voiceId?: string;
    model?: string;
    llmProvider?: string;
    ttsProvider?: string;
    provider?: string;
    voiceProvider?: string;
    speaker?: string;
    voiceName?: string;
    speakingRate?: number;
  }): Promise<{ jobId: string }> {
    return await this.fetchAI('/api/v1/ai/jobs/pipeline', {
      method: 'POST',
      body: JSON.stringify({
        jobType: 'STORY_PIPELINE',
        ownerProject: 'nila',
        externalReferenceId: params.storyId,
        payload: params,
      }),
    });
  }

  async getJobStatus(jobId: string): Promise<any> {
    return await this.fetchAI(`/api/v1/ai/jobs/${jobId}`);
  }
}

export default new AIServiceClient();
