type LogLevel = "info" | "warn" | "error" | "debug";

const format = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  const payload = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${payload}`;
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => console.log(format("info", message, meta)),
  warn: (message: string, meta?: Record<string, unknown>) => console.warn(format("warn", message, meta)),
  error: (message: string, meta?: Record<string, unknown>) => console.error(format("error", message, meta)),
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(format("debug", message, meta));
    }
  }
};
