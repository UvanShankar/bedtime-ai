import * as FileSystem from "expo-file-system/legacy";
import { logger } from "../../utils/logger";

export interface ApiErrorPayload {
  error: string | {
    code: string;
    message: string;
    requestId?: string;
  };
  statusCode?: number;
  message?: string;
  success?: boolean;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly requestId?: string;

  constructor(message: string, code = "UNKNOWN_ERROR", requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.requestId = requestId;
  }
}

export class ApiClient {
  private static authToken: string | null = null;
  private static tokenFilePath = `${FileSystem.documentDirectory || ""}nila_auth_token.txt`;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl || "http://localhost:8080/api/v1";
    ApiClient.loadToken();
  }

  private static onboardingFilePath = `${FileSystem.documentDirectory || ""}nila_onboarding_status.txt`;
  private static onboardingCompleted = false;

  static async loadToken(): Promise<string | null> {
    if (ApiClient.authToken) return ApiClient.authToken;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const t = window.localStorage.getItem("nila_auth_token");
        if (t) {
          ApiClient.authToken = t.trim();
          return ApiClient.authToken;
        }
      }
      if (FileSystem.documentDirectory) {
        const token = await FileSystem.readAsStringAsync(ApiClient.tokenFilePath);
        if (token) {
          ApiClient.authToken = token.trim();
          logger.info("AUTH", "Restored persisted session auth token from storage");
        }
      }
    } catch {
      // Ignored if file doesn't exist yet
    }
    return ApiClient.authToken;
  }

  static async setAuthToken(token: string | null) {
    ApiClient.authToken = token;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        if (token) window.localStorage.setItem("nila_auth_token", token);
        else window.localStorage.removeItem("nila_auth_token");
      }
      if (token && FileSystem.documentDirectory) {
        await FileSystem.writeAsStringAsync(ApiClient.tokenFilePath, token);
        logger.success("AUTH", "Auth session token securely persisted");
      } else if (!token && FileSystem.documentDirectory) {
        await FileSystem.deleteAsync(ApiClient.tokenFilePath, { idempotent: true });
        logger.info("AUTH", "Auth session token cleared from storage");
      }
    } catch (e) {
      logger.warn("AUTH", "Could not persist auth token", e);
    }
  }

  static async isOnboardingCompleted(): Promise<boolean> {
    if (ApiClient.onboardingCompleted) return true;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem("nila_onboarded") === "true";
      }
      if (FileSystem.documentDirectory) {
        const val = await FileSystem.readAsStringAsync(ApiClient.onboardingFilePath);
        ApiClient.onboardingCompleted = val?.trim() === "true";
        return ApiClient.onboardingCompleted;
      }
    } catch {
      // file not found
    }
    return false;
  }

  static async setOnboardingCompleted(completed: boolean): Promise<void> {
    ApiClient.onboardingCompleted = completed;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("nila_onboarded", completed ? "true" : "false");
      }
      if (FileSystem.documentDirectory) {
        await FileSystem.writeAsStringAsync(ApiClient.onboardingFilePath, completed ? "true" : "false");
      }
    } catch (e) {
      logger.warn("AUTH", "Could not persist onboarding status", e);
    }
  }

  static getAuthToken(): string | null {
    return ApiClient.authToken;
  }

  static async clearAllSessionData(): Promise<void> {
    ApiClient.authToken = null;
    ApiClient.onboardingCompleted = false;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("nila_auth_token");
        window.localStorage.removeItem("nila_onboarded");
      }
      if (FileSystem.documentDirectory) {
        await FileSystem.deleteAsync(ApiClient.tokenFilePath, { idempotent: true }).catch(() => {});
        await FileSystem.deleteAsync(ApiClient.onboardingFilePath, { idempotent: true }).catch(() => {});
      }
      logger.info("AUTH", "All session tokens and onboarding state purged");
    } catch (e) {
      logger.warn("AUTH", "Error clearing session data", e);
    }
  }

  private async handleResponse<T>(response: Response, startTime: number, method: string, url: string): Promise<T> {
    const duration = Date.now() - startTime;
    const isJson = response.headers.get("content-type")?.includes("application/json");

    if (!response.ok) {
      if (isJson) {
        const errorData = (await response.json()) as ApiErrorPayload;
        const msg =
          typeof errorData.error === "string"
            ? errorData.error
            : typeof errorData.error === "object"
            ? errorData.error?.message
            : errorData.message || `Request failed with status ${response.status}`;
        logger.apiRes(method, url, response.status, duration, { error: msg });
        throw new ApiError(msg, String(errorData.statusCode || response.status));
      }
      const rawText = await response.text();
      logger.apiRes(method, url, response.status, duration, { rawError: rawText });
      throw new ApiError(rawText || `Request failed with status ${response.status}`, "NETWORK_ERROR");
    }

    if (isJson) {
      const json = await response.json();
      if (json && typeof json === "object" && "success" in json) {
        if (!json.success && json.error) {
          const msg =
            typeof json.error === "string"
              ? json.error
              : json.error?.message || "Operation failed";
          logger.apiRes(method, url, response.status, duration, { error: msg });
          throw new ApiError(msg, String(json.statusCode || response.status));
        }
        if ("data" in json) {
          logger.apiRes(method, url, response.status, duration, json.data);
          return json.data as T;
        }
      }
      logger.apiRes(method, url, response.status, duration, json);
      return json as T;
    }

    const text = await response.text();
    logger.apiRes(method, url, response.status, duration, { responseLength: text.length });
    return text as unknown as T;
  }

  private getEffectiveUrl(path: string): string {
    const cleanBase = this.baseUrl.replace(/\/+$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...customHeaders,
    };
    if (ApiClient.authToken) {
      headers["Authorization"] = `Bearer ${ApiClient.authToken}`;
    }
    return headers;
  }

  async get<T>(path: string, customHeaders: Record<string, string> = {}): Promise<T> {
    const url = this.getEffectiveUrl(path);
    logger.apiReq("GET", url);
    const start = Date.now();
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(customHeaders),
      });
      return await this.handleResponse<T>(response, start, "GET", url);
    } catch (err: any) {
      if (!(err instanceof ApiError)) {
        logger.error("API", `Network GET failure (${Date.now() - start}ms) on ${url}`, err);
      }
      throw err;
    }
  }

  async post<T>(path: string, body?: unknown, customHeaders: Record<string, string> = {}): Promise<T> {
    const url = this.getEffectiveUrl(path);
    logger.apiReq("POST", url, body);
    const start = Date.now();
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders({ "Content-Type": "application/json", ...customHeaders }),
        body: body ? JSON.stringify(body) : undefined,
      });
      return await this.handleResponse<T>(response, start, "POST", url);
    } catch (err: any) {
      if (!(err instanceof ApiError)) {
        logger.error("API", `Network POST failure (${Date.now() - start}ms) on ${url}`, err);
      }
      throw err;
    }
  }

  async put<T>(path: string, body?: unknown, customHeaders: Record<string, string> = {}): Promise<T> {
    const url = this.getEffectiveUrl(path);
    logger.apiReq("PUT", url, body);
    const start = Date.now();
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: this.getHeaders({ "Content-Type": "application/json", ...customHeaders }),
        body: body ? JSON.stringify(body) : undefined,
      });
      return await this.handleResponse<T>(response, start, "PUT", url);
    } catch (err: any) {
      if (!(err instanceof ApiError)) {
        logger.error("API", `Network PUT failure (${Date.now() - start}ms) on ${url}`, err);
      }
      throw err;
    }
  }

  async delete<T>(path: string, customHeaders: Record<string, string> = {}): Promise<T> {
    const url = this.getEffectiveUrl(path);
    logger.apiReq("DELETE", url);
    const start = Date.now();
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: this.getHeaders(customHeaders),
      });
      return await this.handleResponse<T>(response, start, "DELETE", url);
    } catch (err: any) {
      if (!(err instanceof ApiError)) {
        logger.error("API", `Network DELETE failure (${Date.now() - start}ms) on ${url}`, err);
      }
      throw err;
    }
  }
}
