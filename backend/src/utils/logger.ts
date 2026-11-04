/* Centralized structured logging */

type LogLevel = "info" | "warn" | "error" | "debug";

const sanitizeData = (data: any): any => {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const clean: Record<string, any> = {};
  const sensitiveKeys = ["password", "token", "secret", "authorization", "apiKey", "apiKeySecret", "content"];

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      clean[key] = sanitizeData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

const formatMessage = (level: LogLevel, message: string, meta?: any) => {
  const timestamp = new Date().toISOString();
  const safeMeta = meta ? JSON.stringify(sanitizeData(meta)) : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${safeMeta}`.trim();
};

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(formatMessage("info", message, meta));
  },
  warn: (message: string, meta?: any) => {
    console.warn(formatMessage("warn", message, meta));
  },
  error: (message: string, meta?: any) => {
    console.error(formatMessage("error", message, meta));
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatMessage("debug", message, meta));
    }
  },
};

