import { ApiClient } from "./ApiClient";
import { AppConfig } from "../../config";
import { Story, StoryRequestInput } from "../../models";

const apiClient = new ApiClient(AppConfig.apiBaseUrl);

export class StoryApi {
  static async generateStory(input: StoryRequestInput): Promise<Story> {
    return apiClient.post<Story>("/stories/generate", input);
  }

  static async getStory(storyId: string): Promise<Story> {
    return apiClient.get<Story>(`/stories/${storyId}`);
  }

  static getStreamUrl(storyId: string): string {
    return `${AppConfig.apiBaseUrl}/stories/${storyId}/stream`;
  }
}
