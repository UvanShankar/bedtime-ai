import { ApiClient } from "./ApiClient";
import { AppConfig } from "../../config";
import { ParentProfile, ChildProfile } from "../../models";

const apiClient = new ApiClient(AppConfig.apiBaseUrl);

export class ParentApi {
  static async createParent(input: {
    name: string;
    relationship: "mother" | "father" | "grandparent" | "guardian" | "other";
    language: string;
    languageCode: string;
    dialect?: string;
    script?: string;
  }): Promise<ParentProfile> {
    return apiClient.post<ParentProfile>("/parents", input);
  }

  static async getParent(parentId: string): Promise<ParentProfile> {
    return apiClient.get<ParentProfile>(`/parents/${parentId}`);
  }

  static async createChild(input: {
    parentId: string;
    name: string;
    age: number;
    interests: string[];
    personality: string[];
    avoidTopics: string[];
    favoriteCharacters?: string[];
  }): Promise<ChildProfile> {
    return apiClient.post<ChildProfile>("/children", input);
  }

  static async getChildrenForParent(parentId: string): Promise<ChildProfile[]> {
    return apiClient.get<ChildProfile[]>(`/children/parent/${parentId}`);
  }
}
