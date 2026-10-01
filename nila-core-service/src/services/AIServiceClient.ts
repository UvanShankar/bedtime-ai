import { ApiError } from '../exceptions/ApiError';

export class AIServiceClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8081';
    this.apiKey = process.env.AI_SERVICE_API_KEY || 'test-ai-key-secret-12345';
  }

  private async fetchAI(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      ...(options.headers || {}),
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errText = await response.text();
      throw new ApiError(`AI Service error (${response.status}): ${errText}`);
    }

    const json = (await response.json()) as any;
    return json.data;
  }

  async cloneVoice(params: {
    ownerProject: string;
    externalReferenceId: string;
    sampleAudioUrls: string[];
    displayName?: string;
  }): Promise<{ aiVoiceId: string; status: string; previewAudioUrl?: string }> {
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
