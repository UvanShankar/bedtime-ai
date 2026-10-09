/**
 * Centralized Application Logger for Nila Bedtime AI Mobile App
 * Formats console output with consistent categories, timestamps, and emoji tags.
 */

export type LogCategory =
  | "APP"
  | "NAV"
  | "AUTH"
  | "PROFILE"
  | "CHILD"
  | "MEMORY"
  | "VOICE"
  | "STORY"
  | "AUDIO"
  | "API";

const CATEGORY_EMOJIS: Record<LogCategory, string> = {
  APP: "🚀",
  NAV: "📱",
  AUTH: "🔑",
  PROFILE: "👤",
  CHILD: "👶",
  MEMORY: "💭",
  VOICE: "🎙️",
  STORY: "📖",
  AUDIO: "🎵",
  API: "🌐",
};

function formatTime(): string {
  const now = new Date();
  return now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
}

function sanitizeData(data: any): any {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("token") || lowerKey.includes("secret") || lowerKey.includes("password")) {
      if (typeof val === "string") {
        sanitized[key] = val.length > 12 ? `${val.substring(0, 6)}...${val.substring(val.length - 4)}` : "***";
      } else {
        sanitized[key] = "***";
      }
    } else if (typeof val === "object" && val !== null) {
      sanitized[key] = sanitizeData(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export const logger = {
  info(category: LogCategory, message: string, data?: any) {
    const emoji = CATEGORY_EMOJIS[category] || "🔹";
    const prefix = `${emoji} [${formatTime()}][NILA:${category}] ${message}`;
    if (data !== undefined) {
      console.log(prefix, sanitizeData(data));
    } else {
      console.log(prefix);
    }
  },

  success(category: LogCategory, message: string, data?: any) {
    const prefix = `✅ [${formatTime()}][NILA:${category}] ${message}`;
    if (data !== undefined) {
      console.log(prefix, sanitizeData(data));
    } else {
      console.log(prefix);
    }
  },

  warn(category: LogCategory, message: string, data?: any) {
    const prefix = `⚠️ [${formatTime()}][NILA:${category}] ${message}`;
    if (data !== undefined) {
      console.warn(prefix, sanitizeData(data));
    } else {
      console.warn(prefix);
    }
  },

  error(category: LogCategory, message: string, error?: any) {
    const prefix = `❌ [${formatTime()}][NILA:${category}] ${message}`;
    if (error !== undefined) {
      const errDetails = error instanceof Error ? error.message : error;
      console.error(prefix, errDetails);
    } else {
      console.error(prefix);
    }
  },

  apiReq(method: string, url: string, body?: any) {
    const prefix = `🌐 [${formatTime()}][NILA:API] ──▶ ${method.toUpperCase()} ${url}`;
    if (body !== undefined && body !== null) {
      console.log(prefix, "Payload:", sanitizeData(body));
    } else {
      console.log(prefix);
    }
  },

  apiRes(method: string, url: string, status: number, durationMs: number, data?: any) {
    const isSuccess = status >= 200 && status < 300;
    const icon = isSuccess ? "✅" : "❌";
    const prefix = `${icon} [${formatTime()}][NILA:API] ◀── ${status} ${method.toUpperCase()} ${url} (${durationMs}ms)`;
    if (data !== undefined && data !== null) {
      console.log(prefix, "Response:", sanitizeData(data));
    } else {
      console.log(prefix);
    }
  },
};
