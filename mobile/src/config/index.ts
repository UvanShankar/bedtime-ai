import { Platform } from "react-native";

const AWS_PROD_API_URL = "https://vchuxxma5j.execute-api.ap-south-1.amazonaws.com/api/v1";

const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && !envUrl.includes("onrender.com")) {
    return envUrl;
  }
  return AWS_PROD_API_URL;
};

export const AppConfig = {
  apiBaseUrl: getApiBaseUrl(),
  environment: (process.env.EXPO_PUBLIC_ENV || "production") as "development" | "staging" | "production",
  maxVoiceDurationSeconds: 90,
  minVoiceDurationSeconds: 15,
};
