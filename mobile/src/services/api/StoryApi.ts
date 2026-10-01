import { ApiClient } from "./ApiClient";
import { AppConfig } from "../../config";
import { Story, StoryRequestInput } from "../../models";

const apiClient = new ApiClient(AppConfig.apiBaseUrl);

export interface CoreStoryResponse {
  storyId: string;
  userId: string;
  childId: string;
  voiceId?: string;
  title: string;
  theme?: string;
  targetDurationMinutes?: number;
  moralLesson?: string;
  includedMemoryIds?: string[];
  language?: string;
  dialect?: string;
  status: "QUEUED" | "GENERATING_SCRIPT" | "GENERATING_AUDIO" | "READY" | "FAILED";
  progressPercent: number;
  stageMessage?: string;
  script?: string;
  audioS3Key?: string;
  audioCloudFrontUrl?: string;
  audioDurationSeconds?: number;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export class StoryApi {
  static async generateStory(
    input: StoryRequestInput & { promptIdea?: string; voiceProfileId?: string; moralTheme?: string }
  ): Promise<Story> {
    const payload = {
      childId: input.childId,
      voiceId: input.voiceProfileId || undefined,
      theme: input.storyType || "bedtime_calm",
      promptIdea: input.promptIdea || input.topic || "Bedtime Story",
      moralLesson: input.educationalGoal || input.moralTheme || undefined,
      targetDurationMinutes: input.durationMinutes || 5,
      includeMemoryIds: input.selectedMemoryIds || (input.includeLifeMemories ? [] : undefined),
    };

    const res = await apiClient.post<CoreStoryResponse>("/stories/generate", payload);
    return this.mapToStoryModel(res, input.topic);
  }

  static async createStory(input: StoryRequestInput): Promise<{ story: Story }> {
    const story = await this.generateStory(input);
    return { story };
  }

  static async getStoryStatus(storyId: string): Promise<{
    storyId: string;
    status: string;
    progressPercent: number;
    stageMessage?: string;
  }> {
    return apiClient.get(`/stories/${storyId}/status`);
  }

  static async getStory(storyId: string): Promise<Story> {
    const res = await apiClient.get<CoreStoryResponse>(`/stories/${storyId}`);
    return this.mapToStoryModel(res);
  }

  static async getStories(childIdOrParentId?: string): Promise<Story[]> {
    const query =
      childIdOrParentId && !childIdOrParentId.startsWith("parent")
        ? `?childId=${childIdOrParentId}`
        : "";
    const list = await apiClient.get<CoreStoryResponse[]>(`/stories${query}`);
    return (list || []).map((s) => this.mapToStoryModel(s));
  }

  static async toggleFavorite(storyId: string): Promise<{ isFavorite: boolean }> {
    return apiClient.put(`/stories/${storyId}/favorite`);
  }

  static getStreamUrl(storyId: string): string {
    return `${AppConfig.apiBaseUrl}/stories/${storyId}/stream`;
  }

  private static mapToStoryModel(res: CoreStoryResponse, originalTopic?: string): Story {
    const defaultText =
      res.script ||
      `கண்ணா... ஒரு அழகான கதை கேளு. ${originalTopic || res.title}. நல்லா தூங்கு கண்ணா... இனிமையான கனவுகள் வரட்டும்.`;
    return {
      id: res.storyId,
      requestId: `req-${res.storyId}`,
      parentId: res.userId,
      childId: res.childId,
      title: res.title || originalTopic || "BEDTIME STORY",
      languageCode: res.language || "ta",
      summary: `${res.title} - இனிமையான இரவு தூக்கக் கதை.`,
      text: defaultText,
      segments: [{ id: "1", order: 1, text: defaultText }],
      narrationVersion: "1.0",
      audioStatus: res.status === "READY" ? "ready" : "processing",
      audioDurationSeconds: res.audioDurationSeconds || 300,
      audioUrl: res.audioCloudFrontUrl || "https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
      narratorName: "Dad's Voice",
      narratorStyle: "Tamil · Chennai spoken style",
      isFavorite: res.isFavorite ?? false,
      createdAt: res.createdAt ? new Date(res.createdAt).toLocaleDateString() : "Tonight",
    };
  }
}
