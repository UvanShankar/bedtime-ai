import { ApiClient } from "./ApiClient";
import { AppConfig } from "../../config";
import { Story, StoryRequestInput } from "../../models";

const apiClient = new ApiClient(AppConfig.apiBaseUrl);

export class StoryApi {
  static async generateStory(input: StoryRequestInput): Promise<Story> {
    return apiClient.post<Story>("/stories/generate", input);
  }

  static async createStory(input: StoryRequestInput): Promise<{ story: Story }> {
    const story = await apiClient.post<Story>("/stories/generate", input);
    return { story };
  }

  static async getStory(storyId: string): Promise<Story> {
    return apiClient.get<Story>(`/stories/${storyId}`);
  }

  static async getStories(parentId: string): Promise<Story[]> {
    return apiClient.get<Story[]>(`/parents/${parentId}/stories`);
  }

  static getStreamUrl(storyId: string): string {
    return `${AppConfig.apiBaseUrl}/stories/${storyId}/stream`;
  }
}
