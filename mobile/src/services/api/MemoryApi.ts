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
  private static mapToLifeMemory(m: CoreMemory, defaultParentId = "", defaultChildId = ""): LifeMemory {
    return {
      id: m.memoryId,
      parentId: m.userId || defaultParentId,
      childId: m.childId || defaultChildId,
      title: m.title,
      category: (m.tags && m.tags.length > 0) ? m.tags[0] : "FAMILY MEMORY",
      description: m.description,
      date: m.eventDate || (m.createdAt ? m.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
      emotions: m.tags || [],
      imageUrl: m.photoUrl,
      useInStories: true,
      timesUsed: m.wovenStoryCount || 0,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  static async getMemories(childId?: string, parentId = "parent-001"): Promise<LifeMemory[]> {
    const query = childId ? `?childId=${childId}` : "";
    const list = await apiClient.get<CoreMemory[]>(`/memories${query}`);
    return (list || []).map((m) => this.mapToLifeMemory(m, parentId, childId));
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
    return this.mapToLifeMemory(res, input.parentId, input.childId);
  }

  static async updateMemory(
    memoryId: string,
    updates: {
      title?: string;
      description?: string;
      eventDate?: string;
      tags?: string[];
      photoUrl?: string;
    }
  ): Promise<LifeMemory> {
    const res = await apiClient.put<CoreMemory>(`/memories/${memoryId}`, updates);
    return this.mapToLifeMemory(res);
  }

  static async deleteMemory(memoryId: string): Promise<void> {
    await apiClient.delete(`/memories/${memoryId}`);
  }
}
