import { ApiClient } from "./ApiClient";
import { AppConfig } from "../../config";
import { ParentProfile, ChildProfile } from "../../models";

const apiClient = new ApiClient(AppConfig.apiBaseUrl);

export interface CoreParentProfile {
  userId: string;
  fullName: string;
  email?: string;
  mobile?: string;
  relationship?: string;
  preferredLanguage?: string;
  preferredDialect?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoreChildProfile {
  childId: string;
  userId: string;
  name: string;
  age: number;
  gender?: string;
  interests?: string[];
  fearsToAvoid?: string[];
  favoriteCharacters?: string[];
  storySettings?: {
    tamilDialect?: string;
    slangLevel?: string;
    bedtimePacing?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export class ParentApi {
  // Live Core Service API: /parent/profile
  static async getProfile(): Promise<CoreParentProfile> {
    return apiClient.get<CoreParentProfile>("/parent/profile");
  }

  static async updateProfile(input: {
    fullName?: string;
    relationship?: string;
    preferredLanguage?: string;
    preferredDialect?: string;
  }): Promise<CoreParentProfile> {
    return apiClient.put<CoreParentProfile>("/parent/profile", input);
  }

  // Live Core Service API: /children
  static async createChild(input: {
    name: string;
    age: number;
    gender?: string;
    interests?: string[];
    fearsToAvoid?: string[];
    favoriteCharacters?: string[];
    storySettings?: {
      tamilDialect?: string;
      slangLevel?: string;
      bedtimePacing?: string;
    };
    // Legacy support
    parentId?: string;
    personality?: string[];
    avoidTopics?: string[];
  }): Promise<ChildProfile> {
    const payload = {
      name: input.name,
      age: input.age,
      gender: (input.gender as any) || "unspecified",
      interests: input.interests || [],
      fearsToAvoid: input.fearsToAvoid || input.avoidTopics || [],
      favoriteCharacters: input.favoriteCharacters || [],
      storySettings: input.storySettings || {
        tamilDialect: "Chennai",
        slangLevel: "natural",
        bedtimePacing: "gentle_slowdown",
      },
    };

    const res = await apiClient.post<CoreChildProfile>("/children", payload);
    return {
      id: res.childId,
      parentId: res.userId,
      name: res.name,
      age: res.age,
      interests: res.interests || [],
      personality: input.personality || ["Curious", "Gentle"],
      avoidTopics: res.fearsToAvoid || [],
      bedtimeAvoidances: res.fearsToAvoid || [],
      favoriteCharacters: res.favoriteCharacters || [],
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    };
  }

  static async getChildren(): Promise<ChildProfile[]> {
    const list = await apiClient.get<CoreChildProfile[]>("/children");
    return (list || []).map((c) => ({
      id: c.childId,
      parentId: c.userId,
      name: c.name,
      age: c.age,
      interests: c.interests || [],
      personality: ["Curious", "Playful"],
      avoidTopics: c.fearsToAvoid || [],
      bedtimeAvoidances: c.fearsToAvoid || [],
      favoriteCharacters: c.favoriteCharacters || [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  static async getChild(childId: string): Promise<ChildProfile> {
    const c = await apiClient.get<CoreChildProfile>(`/children/${childId}`);
    return {
      id: c.childId,
      parentId: c.userId,
      name: c.name,
      age: c.age,
      interests: c.interests || [],
      personality: ["Curious", "Playful"],
      avoidTopics: c.fearsToAvoid || [],
      bedtimeAvoidances: c.fearsToAvoid || [],
      favoriteCharacters: c.favoriteCharacters || [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  static async updateChild(childId: string, input: Partial<CoreChildProfile>): Promise<ChildProfile> {
    const c = await apiClient.put<CoreChildProfile>(`/children/${childId}`, input);
    return {
      id: c.childId,
      parentId: c.userId,
      name: c.name,
      age: c.age,
      interests: c.interests || [],
      personality: ["Curious", "Playful"],
      avoidTopics: c.fearsToAvoid || [],
      bedtimeAvoidances: c.fearsToAvoid || [],
      favoriteCharacters: c.favoriteCharacters || [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  static async deleteChild(childId: string): Promise<void> {
    await apiClient.delete(`/children/${childId}`);
  }

  // Backwards compatibility wrappers
  static async createParent(input: {
    name: string;
    relationship: "mother" | "father" | "grandparent" | "guardian" | "other";
    language: string;
    languageCode: string;
    dialect?: string;
    script?: string;
  }): Promise<ParentProfile> {
    const res = await this.updateProfile({
      fullName: input.name,
      relationship: input.relationship,
      preferredLanguage: input.languageCode,
      preferredDialect: input.dialect,
    });
    return {
      id: res.userId,
      name: res.fullName,
      relationship: input.relationship,
      language: input.language,
      languageCode: input.languageCode,
      dialect: input.dialect || "Chennai",
      script: input.script || "Tamil",
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    };
  }

  static async getParent(_parentId?: string): Promise<ParentProfile> {
    const res = await this.getProfile();
    return {
      id: res.userId,
      name: res.fullName,
      relationship: res.relationship || "Appa",
      language: res.preferredLanguage === "ta" ? "Tamil" : "English",
      languageCode: res.preferredLanguage || "ta",
      dialect: res.preferredDialect || "Chennai",
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    };
  }

  static async getChildrenForParent(_parentId?: string): Promise<ChildProfile[]> {
    return this.getChildren();
  }
}
