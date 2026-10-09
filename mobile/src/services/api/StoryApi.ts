import { ApiClient } from "./ApiClient";
import { AppConfig } from "../../config";
import { Story, StoryRequestInput } from "../../models";
import { logger } from "../../utils/logger";

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
  storyScript?: string;
  audioS3Key?: string;
  audioCloudFrontUrl?: string;
  audioUrl?: string;
  audioDurationSeconds?: number;
  coverImageUrl?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoryStatusResponse {
  storyId: string;
  status: "QUEUED" | "GENERATING_SCRIPT" | "GENERATING_AUDIO" | "READY" | "FAILED";
  progressPercent: number;
  stageMessage?: string;
}

export class StoryApi {
  // 1. Trigger story generation in nila-core-service
  static async generateStory(
    input: StoryRequestInput & {
      promptIdea?: string;
      voiceProfileId?: string;
      moralTheme?: string;
      voiceProvider?: string;
      dialect?: string;
    }
  ): Promise<Story> {
    const payload = {
      childId: input.childId,
      voiceId: input.voiceProfileId || undefined,
      provider: input.voiceProvider || undefined,
      theme: input.storyType || "bedtime_calm",
      mood: input.mood || "Gentle & Sleepy",
      promptIdea: input.promptIdea || input.topic || "Bedtime Story",
      moralLesson: input.educationalGoal || input.moralTheme || undefined,
      targetDurationMinutes: input.durationMinutes || 5,
      bedtimeCalmness: input.bedtimeCalmness ?? 0.8,
      includeChildName: input.includeChildName ?? true,
      includeFavoriteThings: input.includeFavoriteThings ?? true,
      includeFamilyMembers: input.includeFamilyMembers ?? false,
      dialect: input.dialect || undefined,
      includeMemoryIds: input.selectedMemoryIds || (input.includeLifeMemories ? [] : undefined),
      additionalInstruction: input.additionalInstruction || undefined,
    };

    logger.info("STORY", `Initiating story generation: "${input.promptIdea || input.topic}"`, {
      childId: input.childId,
      theme: input.storyType,
      mood: input.mood,
      duration: `${input.durationMinutes || 5} min`,
      calmness: input.bedtimeCalmness,
      voiceId: input.voiceProfileId,
    });
    const res = await apiClient.post<CoreStoryResponse>("/stories/generate", payload);
    logger.success("STORY", `Story job queued on backend: ${res.storyId} (status: ${res.status})`);
    return this.mapToStoryModel(res, input.topic);
  }

  static async createStory(input: StoryRequestInput): Promise<{ story: Story }> {
    const story = await this.generateStory(input);
    return { story };
  }

  // 2. Poll story generation status from nila-core-service
  static async getStoryStatus(storyId: string): Promise<StoryStatusResponse> {
    return apiClient.get<StoryStatusResponse>(`/stories/${storyId}/status`);
  }

  // 3. Fetch full completed story details
  static async getStory(storyId: string): Promise<Story> {
    const res = await apiClient.get<CoreStoryResponse>(`/stories/${storyId}`);
    return this.mapToStoryModel(res);
  }

  // 4. Poll helper with progress callback that resolves when story is READY
  static async pollStoryUntilReady(
    storyId: string,
    onProgress?: (status: StoryStatusResponse) => void,
    maxAttempts = 240, // 240 * 3s = 12 minutes max poll
    intervalMs = 3000
  ): Promise<Story> {
    logger.info("STORY", `Starting status polling for storyId=${storyId} (interval: ${intervalMs}ms)...`);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const statusData = await this.getStoryStatus(storyId);
        logger.info(
          "STORY",
          `[Poll ${attempt}/${maxAttempts}] status=${statusData.status}, progress=${statusData.progressPercent}%${
            statusData.stageMessage ? ` ("${statusData.stageMessage}")` : ""
          }`
        );

        if (onProgress) {
          onProgress(statusData);
        }

        if (statusData.status === "READY") {
          logger.success("STORY", `Story ${storyId} is READY! Fetching full story details...`);
          return await this.getStory(storyId);
        }

        if (statusData.status === "FAILED") {
          logger.error("STORY", `Story ${storyId} generation failed on server`, statusData.stageMessage);
          throw new Error(statusData.stageMessage || "Story generation failed on server");
        }
      } catch (err: any) {
        if (err.message && err.message.includes("failed on server")) {
          throw err;
        }
        logger.warn("STORY", `Poll attempt ${attempt} warning`, err.message);
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    logger.error("STORY", `Story generation timed out after ${maxAttempts} poll attempts`);
    throw new Error("Story generation timed out after polling");
  }

  // 5. List stories from DynamoDB
  static async getStories(childIdOrParentId?: string): Promise<Story[]> {
    const query =
      childIdOrParentId && !childIdOrParentId.startsWith("parent")
        ? `?childId=${childIdOrParentId}`
        : "";
    const list = await apiClient.get<CoreStoryResponse[]>(`/stories${query}`);
    return (list || []).map((s) => this.mapToStoryModel(s));
  }

  // 6. Toggle Favorite status
  static async toggleFavorite(storyId: string, isFavorite = true): Promise<{ message?: string; isFavorite?: boolean }> {
    return apiClient.put(`/stories/${storyId}/favorite`, { isFavorite });
  }

  static getStreamUrl(storyId: string): string {
    return `${AppConfig.apiBaseUrl}/stories/${storyId}/stream`;
  }

  // Helper: converts backend CoreStoryResponse to frontend Story model
  public static mapToStoryModel(res: CoreStoryResponse, originalTopic?: string): Story {
    const rawScript = (res.storyScript || res.script || "").trim();
    const fallbackText = `கண்ணா... ஒரு அழகான கதை கேளு. ${originalTopic || res.title}. நல்லா தூங்கு கண்ணா... இனிமையான கனவுகள் வரட்டும்.`;
    const fullText = rawScript || fallbackText;

    // Segment paragraphs so subtitles and player scroll cleanly
    const paragraphs = fullText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const segments = paragraphs.length > 0
      ? paragraphs.map((text, idx) => ({
          id: String(idx + 1),
          order: idx + 1,
          text,
        }))
      : [{ id: "1", order: 1, text: fullText }];

    const audioUrl =
      res.audioUrl ||
      res.audioCloudFrontUrl ||
      "";

    if (!audioUrl) {
      logger.error("AUDIO", `[StoryApi] Story ${res.storyId} has NO audioUrl in response!`);
    } else {
      logger.info("AUDIO", `[StoryApi] Story ${res.storyId} S3 audioUrl: ${audioUrl}`);
      console.log(`[S3 AUDIO STREAM URL]: ${audioUrl}`);
    }

    return {
      id: res.storyId,
      requestId: `req-${res.storyId}`,
      parentId: res.userId,
      childId: res.childId,
      title: res.title || originalTopic || "BEDTIME STORY",
      languageCode: res.language || "ta",
      summary: `${res.title} - இனிமையான இரவு தூக்கக் கதை.`,
      text: fullText,
      segments,
      narrationVersion: "1.0",
      audioStatus: res.status === "READY" ? "ready" : "processing",
      audioDurationSeconds: res.audioDurationSeconds || (res.targetDurationMinutes ? res.targetDurationMinutes * 60 : 300),
      audioUrl: audioUrl || undefined, // NO FALLBACK!
      narratorName: "Dad's Voice",
      narratorStyle: `${res.dialect || "Chennai"} · Spoken Tamil`,
      isFavorite: res.isFavorite ?? false,
      createdAt: res.createdAt ? new Date(res.createdAt).toLocaleDateString() : "Tonight",
    };
  }
}
