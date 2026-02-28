/**
 * Structured logger for Purple Glow Social 2.0
 *
 * All application logging should go through this module.
 * DO NOT use console.log directly — use logger.info/warn/error instead.
 *
 * In production, this can be extended to ship logs to an external service
 * (e.g., Axiom, Datadog, Sentry) without changing call sites.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

function createEntry(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
  };
}

function emit(entry: LogEntry): void {
  const prefix = `[${entry.level.toUpperCase()}]`;
  const msg = `${prefix} ${entry.timestamp} ${entry.message}`;

  switch (entry.level) {
    case "error":
      console.error(msg, entry.data ?? "");
      break;
    case "warn":
      console.warn(msg, entry.data ?? "");
      break;
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.debug(msg, entry.data ?? "");
      }
      break;
    default:
      console.info(msg, entry.data ?? "");
  }
}

export const logger = {
  debug(message: string, data?: Record<string, unknown>): void {
    emit(createEntry("debug", message, data));
  },

  info(message: string, data?: Record<string, unknown>): void {
    emit(createEntry("info", message, data));
  },

  warn(message: string, data?: Record<string, unknown>): void {
    emit(createEntry("warn", message, data));
  },

  error(message: string, data?: Record<string, unknown>): void {
    emit(createEntry("error", message, data));
  },
};
