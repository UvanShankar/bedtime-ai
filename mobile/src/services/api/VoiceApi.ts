import { ApiClient } from "./ApiClient";
import { AppConfig } from "../../config";
import { VoiceProfile } from "../../models";

const apiClient = new ApiClient(AppConfig.apiBaseUrl);

export interface VoiceUploadResponse {
  voiceProfile: VoiceProfile;
  styleProfile: Record<string, unknown>;
  message: string;
}

export class VoiceApi {
  static async uploadVoiceSample(input: {
    parentId: string;
    audioUri: string;
    mimeType?: string;
    consent: boolean;
  }): Promise<VoiceUploadResponse> {
    const formData = new FormData();
    formData.append("consent", input.consent ? "true" : "false");

    const filename = input.audioUri.split("/").pop() || "parent_voice.m4a";
    const type = input.mimeType || "audio/m4a";

    // React Native FormData file representation
    formData.append("audio", {
      uri: input.audioUri,
      name: filename,
      type,
    } as any);

    return apiClient.upload<VoiceUploadResponse>(`/parents/${input.parentId}/voice`, formData);
  }

  static async getVoiceProfile(parentId: string): Promise<VoiceProfile> {
    return apiClient.get<VoiceProfile>(`/parents/${parentId}/voice`);
  }

  static async deleteVoiceProfile(parentId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/parents/${parentId}/voice`);
  }
}
