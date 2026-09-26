import { Platform } from "react-native";

const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  // Android Emulator requires 10.0.2.2 to reach the host machine localhost
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000/api/v1";
  }
  return "http://localhost:3000/api/v1";
};

export const AppConfig = {
  apiBaseUrl: getApiBaseUrl(),
  environment: (process.env.EXPO_PUBLIC_ENV || "development") as "development" | "staging" | "production",
  maxVoiceDurationSeconds: 90,
  minVoiceDurationSeconds: 15,
};
