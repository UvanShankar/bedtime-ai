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

export interface SendOtpResponse {
  success: boolean;
  message: string;
  mobile: string;
  otp?: string;
  expiresAt?: number;
}

export class AuthApi {
  // 1. Send OTP to Phone Number
  static async sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
    const res = await apiClient.post<SendOtpResponse>("/auth/send-otp", {
      phoneNumber,
      mobile: phoneNumber,
    });
    return res;
  }

  // 2. Verify OTP & Authenticate
  static async verifyOtp(input: {
    phoneNumber: string;
    otp: string;
    fullName?: string;
    relationship?: string;
  }): Promise<AuthResponseData> {
    const res = await apiClient.post<AuthResponseData>("/auth/verify-otp", {
      phoneNumber: input.phoneNumber,
      mobile: input.phoneNumber,
      otp: input.otp,
      fullName: input.fullName,
      relationship: input.relationship,
    });
    if (res?.tokens?.accessToken) {
      await ApiClient.setAuthToken(res.tokens.accessToken);
    }
    return res;
  }

  // Backwards compatible signup
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

  // Backwards compatible login
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

  static async ensureAuth(defaultName = "Uvan (Appa)", defaultMobile = "+919876543210"): Promise<string> {
    const existingToken = await ApiClient.loadToken();
    if (existingToken) {
      try {
        const profile = await apiClient.get<any>("/parent/profile");
        if (profile?.userId) {
          return existingToken;
        }
      } catch {
        console.log("[AuthApi] Saved token expired or invalid, restoring session via OTP...");
      }
    }

    try {
      // Auto-authenticate via verify-otp using demo test code
      const authRes = await AuthApi.verifyOtp({
        phoneNumber: defaultMobile,
        otp: "123456",
        fullName: defaultName,
        relationship: "Appa",
      });
      return authRes.tokens.accessToken;
    } catch {
      // Fallback: request OTP and verify
      try {
        const otpRes = await AuthApi.sendOtp(defaultMobile);
        const code = otpRes.otp || "123456";
        const authRes = await AuthApi.verifyOtp({
          phoneNumber: defaultMobile,
          otp: code,
          fullName: defaultName,
          relationship: "Appa",
        });
        return authRes.tokens.accessToken;
      } catch (e) {
        console.warn("[AuthApi] ensureAuth fallback warning:", e);
        return existingToken || "";
      }
    }
  }
}
