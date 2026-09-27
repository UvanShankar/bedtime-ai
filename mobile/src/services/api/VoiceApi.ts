import * as FileSystem from "expo-file-system/legacy";
import { ApiClient, ApiError } from "./ApiClient";
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
    const uploadUrl = `${AppConfig.apiBaseUrl}/parents/${input.parentId}/voice`;

    const response = await FileSystem.uploadAsync(uploadUrl, input.audioUri, {
      fieldName: "audio",
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      parameters: {
        consent: input.consent ? "true" : "false",
      },
      headers: {
        Accept: "application/json",
      },
      mimeType: input.mimeType || "audio/m4a",
    });

    if (response.status < 200 || response.status >= 300) {
      let errorMessage = `Upload failed with status ${response.status}`;
      let errorCode = "UPLOAD_ERROR";
      try {
        const errorData = JSON.parse(response.body);
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        }
        if (errorData?.error?.code) {
          errorCode = errorData.error.code;
        }
      } catch {
        if (response.body) {
          errorMessage = response.body;
        }
      }
      throw new ApiError(errorMessage, errorCode);
    }

    return JSON.parse(response.body) as VoiceUploadResponse;
  }

  static async getVoiceProfile(parentId: string): Promise<VoiceProfile> {
    return apiClient.get<VoiceProfile>(`/parents/${parentId}/voice`);
  }

  static async deleteVoiceProfile(parentId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/parents/${parentId}/voice`);
  }
}
