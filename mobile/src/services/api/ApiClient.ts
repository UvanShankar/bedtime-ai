import * as FileSystem from "expo-file-system/legacy";

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

  static async loadToken(): Promise<string | null> {
    if (ApiClient.authToken) return ApiClient.authToken;
    try {
      if (FileSystem.documentDirectory) {
        const token = await FileSystem.readAsStringAsync(ApiClient.tokenFilePath);
        if (token) ApiClient.authToken = token.trim();
      }
    } catch {
      // Ignored if file doesn't exist yet
    }
    return ApiClient.authToken;
  }

  static async setAuthToken(token: string | null) {
    ApiClient.authToken = token;
    try {
      if (token && FileSystem.documentDirectory) {
        await FileSystem.writeAsStringAsync(ApiClient.tokenFilePath, token);
      } else if (!token && FileSystem.documentDirectory) {
        await FileSystem.deleteAsync(ApiClient.tokenFilePath, { idempotent: true });
      }
    } catch (e) {
      console.warn("[ApiClient] Could not persist auth token:", e);
    }
  }

  static getAuthToken(): string | null {
    return ApiClient.authToken;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
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
        throw new ApiError(msg, String(errorData.statusCode || response.status));
      }
      const rawText = await response.text();
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
          throw new ApiError(msg, String(json.statusCode || response.status));
        }
        if ("data" in json) {
          return json.data as T;
        }
      }
      return json as T;
    }
    return (await response.text()) as unknown as T;
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
    console.log(`[ApiClient] GET ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(customHeaders),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body?: unknown, customHeaders: Record<string, string> = {}): Promise<T> {
    const url = this.getEffectiveUrl(path);
    console.log(`[ApiClient] POST ${url}`);
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders({ "Content-Type": "application/json", ...customHeaders }),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, body?: unknown, customHeaders: Record<string, string> = {}): Promise<T> {
    const url = this.getEffectiveUrl(path);
    console.log(`[ApiClient] PUT ${url}`);
    const response = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders({ "Content-Type": "application/json", ...customHeaders }),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string, customHeaders: Record<string, string> = {}): Promise<T> {
    const url = this.getEffectiveUrl(path);
    console.log(`[ApiClient] DELETE ${url}`);
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(customHeaders),
    });
    return this.handleResponse<T>(response);
  }
}
