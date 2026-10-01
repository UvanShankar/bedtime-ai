import { ApiClient } from "./ApiClient";
import { AppConfig } from "../../config";
import { LifeMemory } from "../../models";

const apiClient = new ApiClient(AppConfig.apiBaseUrl);

export interface CoreMemory {
  memoryId: string;
  userId: string;
  childId?: string;
  title: string;
  description: string;
  eventDate?: string;
  tags?: string[];
  photoUrl?: string;
  wovenStoryCount?: number;
  createdAt: string;
  updatedAt: string;
}

export class MemoryApi {
  static async getMemories(childId?: string, parentId = "parent-001"): Promise<LifeMemory[]> {
    const query = childId ? `?childId=${childId}` : "";
    const list = await apiClient.get<CoreMemory[]>(`/memories${query}`);
    return (list || []).map((m) => ({
      id: m.memoryId,
      parentId: m.userId || parentId,
      childId: m.childId || childId || "",
      title: m.title,
      description: m.description,
      date: m.eventDate || m.createdAt || new Date().toISOString(),
      useInStories: true,
      timesUsed: m.wovenStoryCount || 0,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  static async createMemory(input: {
    parentId?: string;
    childId?: string;
    title: string;
    description: string;
    eventDate?: string;
    date?: string;
    tags?: string[];
    photoUrl?: string;
  }): Promise<LifeMemory> {
    const res = await apiClient.post<CoreMemory>("/memories", {
      childId: input.childId,
      title: input.title,
      description: input.description,
      eventDate: input.eventDate || input.date,
      tags: input.tags,
      photoUrl: input.photoUrl,
    });
    return {
      id: res.memoryId,
      parentId: res.userId || input.parentId || "",
      childId: res.childId || input.childId || "",
      title: res.title,
      description: res.description,
      date: res.eventDate || res.createdAt || new Date().toISOString(),
      useInStories: true,
      timesUsed: res.wovenStoryCount || 0,
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    };
  }

  static async deleteMemory(memoryId: string): Promise<void> {
    await apiClient.delete(`/memories/${memoryId}`);
  }
}
