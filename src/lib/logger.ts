export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export interface LoggerSink {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export interface LoggerOptions {
  level?: LogLevel;
  sink?: LoggerSink;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50,
};

const DEFAULT_SINK: LoggerSink = {
  debug: (...args) => console.debug(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

export function createLogger(
  namespace: string,
  options: LoggerOptions = {},
): Logger {
  const level = options.level ?? "info";
  const sink = options.sink ?? DEFAULT_SINK;
  const prefix = `[PromptBall:${namespace}]`;

  return {
    debug: (...args) => writeLog("debug", level, sink, prefix, args),
    info: (...args) => writeLog("info", level, sink, prefix, args),
    warn: (...args) => writeLog("warn", level, sink, prefix, args),
    error: (...args) => writeLog("error", level, sink, prefix, args),
  };
}

function writeLog(
  level: Exclude<LogLevel, "silent">,
  minimumLevel: LogLevel,
  sink: LoggerSink,
  prefix: string,
  args: unknown[],
): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[minimumLevel]) {
    return;
  }

  sink[level](prefix, ...args);
}
