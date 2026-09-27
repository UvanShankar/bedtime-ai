import { Platform } from "react-native";

const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  return "https://bedtime-ai-backend.onrender.com/api/v1";
};

export const AppConfig = {
  apiBaseUrl: getApiBaseUrl(),
  environment: (process.env.EXPO_PUBLIC_ENV || "production") as "development" | "staging" | "production",
  maxVoiceDurationSeconds: 90,
  minVoiceDurationSeconds: 15,
};
