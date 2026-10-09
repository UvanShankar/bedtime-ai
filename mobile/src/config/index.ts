import { Platform } from "react-native";

const AWS_PROD_API_URL = "https://vchuxxma5j.execute-api.ap-south-1.amazonaws.com/api/v1";

const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim().length > 0 && !envUrl.includes("onrender.com")) {
    let url = envUrl.trim();
    // In Android emulator, localhost points to the emulator itself; remap to host loopback 10.0.2.2
    if (Platform.OS === "android" && url.includes("localhost")) {
      url = url.replace("localhost", "10.0.2.2");
    }
    return url;
  }

  // Development defaults for local backend
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080/api/v1";
  }
  return "http://localhost:8080/api/v1";
};

const apiBaseUrl = getApiBaseUrl();
const environment = (process.env.EXPO_PUBLIC_ENV || "development") as "development" | "staging" | "production";

console.log(
  `🚀 [NILA:APP] Initialized | Platform: ${Platform.OS} | Env: ${environment} | Backend: ${apiBaseUrl}`
);

export const AppConfig = {
  apiBaseUrl,
  environment,
  maxVoiceDurationSeconds: 90,
  minVoiceDurationSeconds: 15,
};
