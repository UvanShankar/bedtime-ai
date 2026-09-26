export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
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
  constructor(private baseUrl: string) {}

  private async handleResponse<T>(response: Response): Promise<T> {
    const isJson = response.headers.get("content-type")?.includes("application/json");
    if (!response.ok) {
      if (isJson) {
        const errorData = (await response.json()) as ApiErrorPayload;
        throw new ApiError(
          errorData.error?.message || "An API error occurred",
          errorData.error?.code || "API_ERROR",
          errorData.error?.requestId
        );
      }
      const rawText = await response.text();
      throw new ApiError(rawText || `Request failed with status ${response.status}`, "NETWORK_ERROR");
    }

    if (isJson) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  }

  async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        // Do not set Content-Type header so fetch automatically handles multipart boundary!
      },
      body: formData,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });
    return this.handleResponse<T>(response);
  }
}
