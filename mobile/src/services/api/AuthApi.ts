import { ApiClient } from "./ApiClient";
import { AppConfig } from "../../config";

const apiClient = new ApiClient(AppConfig.apiBaseUrl);

export interface AuthUser {
  userId: string;
  fullName: string;
  mobile?: string;
  email?: string;
  relationship?: string;
  isVerified: boolean;
}

export interface AuthResponseData {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class AuthApi {
  static async signup(input: {
    fullName: string;
    email?: string;
    mobile?: string;
    password?: string;
    relationship?: string;
    preferredLanguage?: string;
  }): Promise<AuthResponseData> {
    const res = await apiClient.post<AuthResponseData>("/auth/signup", input);
    if (res?.tokens?.accessToken) {
      await ApiClient.setAuthToken(res.tokens.accessToken);
    }
    return res;
  }

  static async login(input: {
    emailOrMobile: string;
    password?: string;
  }): Promise<AuthResponseData> {
    const res = await apiClient.post<AuthResponseData>("/auth/login", input);
    if (res?.tokens?.accessToken) {
      await ApiClient.setAuthToken(res.tokens.accessToken);
    }
    return res;
  }

  static async logout(): Promise<void> {
    await ApiClient.setAuthToken(null);
  }

  static async ensureAuth(defaultName = "Uvan (Appa)"): Promise<string> {
    const existingToken = await ApiClient.loadToken();
    if (existingToken) {
      try {
        // Validate token by fetching profile
        const profile = await apiClient.get<any>("/parent/profile");
        if (profile?.userId) {
          return existingToken;
        }
      } catch (err) {
        console.log("[AuthApi] Saved token expired or invalid, creating fresh session...");
      }
    }

    // Attempt login with default demo account
    const defaultEmail = "parent.default@nila.ai";
    const defaultPass = "NilaBedtime123!";
    try {
      const loginRes = await AuthApi.login({
        emailOrMobile: defaultEmail,
        password: defaultPass,
      });
      return loginRes.tokens.accessToken;
    } catch {
      // If demo account doesn't exist yet, sign up
      const signupRes = await AuthApi.signup({
        fullName: defaultName,
        email: defaultEmail,
        password: defaultPass,
        relationship: "Appa",
        preferredLanguage: "ta",
      });
      return signupRes.tokens.accessToken;
    }
  }
}
