import * as FileSystem from "expo-file-system/legacy";
import { ApiClient } from "./ApiClient";
import { AppConfig } from "../../config";
import { VoiceProfile } from "../../models";
import { logger } from "../../utils/logger";
import { AuthApi } from "./AuthApi";

const apiClient = new ApiClient(AppConfig.apiBaseUrl);

export interface VoicePromptResponse {
  scriptTamil: string;
  scriptEnglishTransliteration: string;
  targetDurationSeconds: number;
  consentStatement: string;
}

export interface VoiceUploadResponse {
  voiceProfile: VoiceProfile;
  styleProfile: Record<string, unknown>;
  message: string;
}

export class VoiceApi {
  // 1. Get official reading prompt from nila-core-service
  static async getPrompt(): Promise<VoicePromptResponse> {
    logger.info("VOICE", "Fetching official reading prompt from backend...");
    try {
      const res = await apiClient.get<VoicePromptResponse>("/voices/prompt");
      logger.success("VOICE", "Reading prompt loaded successfully");
      return res;
    } catch {
      logger.info("VOICE", "Using fallback reading prompt");
      return {
        scriptTamil: "ஒரு அழகான காட்ல ஒரு சின்ன முயல் இருந்துச்சாம். அந்த முயலுக்கு நிலாவ ரொம்ப பிடிக்குமாம். தினமும் சாயங்காலம் வானத்தைப் பார்த்து நிலா கிட்ட பேசுமாம்...",
        scriptEnglishTransliteration: "Oru azhagana kaatla oru chinna muyal irundhuchaam. Andha muyalukku nilava romba pidikkumaam...",
        targetDurationSeconds: 45,
        consentStatement: "I explicitly consent to Nila using my recorded voice sample solely for synthesizing personalized bedtime stories for my family.",
      };
    }
  }

  // 2. Get AWS S3 Pre-signed URL for direct media upload
  static async getUploadUrl(fileName: string, fileType = "audio/m4a"): Promise<{ uploadUrl: string; key: string }> {
    return apiClient.post<{ uploadUrl: string; key: string }>("/voices/upload-url", {
      fileName,
      fileType,
      contentType: fileType,
    });
  }

  // 3. Full Voice Sample Upload to AWS S3 & Voice Registration
  static async uploadVoiceSample(input: {
    parentId: string;
    audioUri: string;
    mimeType?: string;
    consent: boolean;
    displayName?: string;
    relationship?: string;
    provider?: string;
  }): Promise<VoiceUploadResponse> {
    const rawExt = (input.audioUri.split(".").pop() || "m4a").toLowerCase();
    const ext = rawExt === "wav" ? "wav" : rawExt === "mp3" ? "mp3" : rawExt === "aac" ? "aac" : "m4a";
    const mimeType = input.mimeType || (ext === "wav" ? "audio/wav" : ext === "mp3" ? "audio/mpeg" : ext === "aac" ? "audio/aac" : "audio/m4a");
    const fileName = `voice_${Date.now()}.${ext}`;
    const selectedProvider = (input.provider || "sarvam").toLowerCase();

    logger.info("VOICE", `Starting voice sample registration process for parentId=${input.parentId}, provider=${selectedProvider}`);

    try {
      // Step 0: Ensure valid backend session
      await AuthApi.ensureAuth();

      // Step A: Request AWS S3 pre-signed upload URL
      logger.info("VOICE", `[Step 1/3] Requesting S3 presigned URL for ${fileName} (${mimeType})...`);
      const { uploadUrl, key } = await this.getUploadUrl(fileName, mimeType);
      logger.success("VOICE", `[Step 1/3] S3 presigned URL obtained for key: ${key}`);

      // Step B: Upload audio directly to Amazon S3
      logger.info("VOICE", `[Step 2/3] Uploading audio binary directly to AWS S3 (${input.audioUri})...`);
      const uploadRes = await FileSystem.uploadAsync(uploadUrl, input.audioUri, {
        httpMethod: "PUT",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          "Content-Type": mimeType,
        },
      });

      logger.info("VOICE", `[Step 2/3] S3 upload returned HTTP status ${uploadRes.status}`);
      if (uploadRes.status < 200 || uploadRes.status >= 300) {
        logger.error("VOICE", `[Step 2/3] S3 direct upload failed with status ${uploadRes.status}: ${uploadRes.body}`);
        throw new Error(`S3 direct upload failed with status ${uploadRes.status}: ${uploadRes.body || "Could not upload audio to S3"}`);
      }
      logger.success("VOICE", `[Step 2/3] Audio sample binary successfully uploaded to Amazon S3 (status ${uploadRes.status})`);

      // Step C: Register voice profile in DynamoDB via nila-core-service
      logger.info("VOICE", `[Step 3/3] Registering voice profile in backend with provider=${selectedProvider}...`);
      const registered = await apiClient.post<any>("/voices", {
        displayName: input.displayName || "Appa's Voice",
        relationship: input.relationship || "Appa",
        sampleAudioS3Key: key,
        sampleDurationSeconds: 30,
        consentAffirmed: input.consent,
        provider: selectedProvider,
        voiceProvider: selectedProvider,
      });

      const now = new Date().toISOString();
      const voiceProfile: VoiceProfile = {
        id: registered?.voiceId || registered?.id || `voc_${Date.now()}`,
        parentId: input.parentId,
        provider: registered?.provider || registered?.voiceProvider || selectedProvider,
        providerVoiceId: registered?.providerVoiceId || registered?.aiServiceVoiceId || registered?.voiceId,
        sourceAudioKey: key,
        languageCode: "ta",
        status: (registered?.status?.toLowerCase() as any) || "ready",
        consentAccepted: true,
        displayName: input.displayName || registered?.displayName || "Appa's Voice",
        accentDialect: "Tamil Â· Natural conversational",
        sampleDuration: "30s sample",
        createdAt: registered?.createdAt || now,
        updatedAt: registered?.updatedAt || now,
      };

      logger.success("VOICE", `[Step 3/3] Voice profile successfully registered: ${voiceProfile.displayName} (id: ${voiceProfile.id}, providerVoiceId: ${voiceProfile.providerVoiceId}, provider: ${voiceProfile.provider})`);

      return {
        voiceProfile,
        styleProfile: registered?.styleProfile || {},
        message: registered?.message || "Voice sample registered successfully",
      };
    } catch (err: any) {
      logger.error("VOICE", `[VoiceApi] Voice upload/registration failed: ${err.message}`, err);
      throw err;
    }
  }

  // 4. List user's registered voice profiles
  static async getVoices(): Promise<VoiceProfile[]> {
    try {
      const list = await apiClient.get<any[]>("/voices");
      return (list || []).map((v) => ({
        id: v.voiceId,
        parentId: v.userId,
        provider: v.provider || v.voiceProvider || "sarvam",
        providerVoiceId: v.providerVoiceId || v.aiServiceVoiceId || "priya",
        sourceAudioKey: v.sampleAudioS3Key || "",
        languageCode: "ta",
        displayName: v.displayName || "Parent Voice",
        status: v.status?.toLowerCase() === "ready" ? "ready" : "processing",
        consentAccepted: v.consentVerified ?? v.consentAffirmed ?? true,
        accentDialect: "Tamil Â· Conversational",
        sampleDuration: `${v.sampleDurationSeconds || 30}s`,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      }));
    } catch {
      return [];
    }
  }

  // 5. Get single voice profile with optional coupled provider query
  static async getVoice(voiceId: string, provider?: string): Promise<VoiceProfile | null> {
    try {
      const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
      const v = await apiClient.get<any>(`/voices/${voiceId}${query}`);
      if (!v) return null;
      return {
        id: v.voiceId,
        parentId: v.userId,
        provider: v.provider || v.voiceProvider || "sarvam",
        providerVoiceId: v.providerVoiceId || v.aiServiceVoiceId || "priya",
        sourceAudioKey: v.sampleAudioS3Key || "",
        languageCode: "ta",
        displayName: v.displayName || "Parent Voice",
        status: v.status?.toLowerCase() === "ready" ? "ready" : "processing",
        consentAccepted: v.consentVerified ?? true,
        accentDialect: "Tamil Â· Conversational",
        sampleDuration: `${v.sampleDurationSeconds || 30}s`,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };
    } catch {
      return null;
    }
  }

  static async getVoiceProfile(parentId: string): Promise<VoiceProfile | null> {
    const voices = await this.getVoices();
    return voices.length > 0 ? voices[0] : null;
  }

  static async deleteVoiceProfile(voiceId: string, provider?: string): Promise<{ success: boolean; message: string }> {
    try {
      const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
      await apiClient.delete(`/voices/${voiceId}${query}`);
      return { success: true, message: "Voice removed" };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
