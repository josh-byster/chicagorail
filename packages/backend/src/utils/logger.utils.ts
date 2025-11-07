/**
 * Simple structured logger utility
 * Respects NODE_ENV for log level filtering
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LoggerConfig {
  level: LogLevel;
  enableColors: boolean;
}

const config: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableColors: process.env.NODE_ENV !== 'production',
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const colorize = (color: keyof typeof colors, text: string): string => {
  return config.enableColors ? `${colors[color]}${text}${colors.reset}` : text;
};

const formatTimestamp = (): string => {
  return new Date().toISOString();
};

const shouldLog = (level: LogLevel): boolean => {
  return level >= config.level;
};

/**
 * Debug-level logging - only in development
 * Use for detailed debugging information
 */
export const debug = (message: string, ...args: unknown[]): void => {
  if (!shouldLog(LogLevel.DEBUG)) return;

  const timestamp = colorize('gray', formatTimestamp());
  const level = colorize('cyan', 'DEBUG');
  console.log(`${timestamp} ${level} ${message}`, ...args);
};

/**
 * Info-level logging - general application flow
 * Use for important application events
 */
export const info = (message: string, ...args: unknown[]): void => {
  if (!shouldLog(LogLevel.INFO)) return;

  const timestamp = colorize('gray', formatTimestamp());
  const level = colorize('blue', 'INFO ');
  console.log(`${timestamp} ${level} ${message}`, ...args);
};

/**
 * Warning-level logging - potentially harmful situations
 * Use for recoverable errors or deprecated features
 */
export const warn = (message: string, ...args: unknown[]): void => {
  if (!shouldLog(LogLevel.WARN)) return;

  const timestamp = colorize('gray', formatTimestamp());
  const level = colorize('yellow', 'WARN ');
  console.warn(`${timestamp} ${level} ${message}`, ...args);
};

/**
 * Error-level logging - error events
 * Use for errors that need attention
 */
export const error = (
  message: string,
  error?: unknown,
  ...args: unknown[]
): void => {
  if (!shouldLog(LogLevel.ERROR)) return;

  const timestamp = colorize('gray', formatTimestamp());
  const level = colorize('red', 'ERROR');

  if (error instanceof Error) {
    console.error(`${timestamp} ${level} ${message}`, error.message, ...args);
    if (config.level === LogLevel.DEBUG) {
      console.error(error.stack);
    }
  } else {
    console.error(`${timestamp} ${level} ${message}`, error, ...args);
  }
};

/**
 * Configure logger settings
 */
export const configure = (newConfig: Partial<LoggerConfig>): void => {
  Object.assign(config, newConfig);
};

/**
 * Get current logger configuration
 */
export const getConfig = (): Readonly<LoggerConfig> => {
  return { ...config };
};

// Default export for convenience
export default {
  debug,
  info,
  warn,
  error,
  configure,
  getConfig,
  LogLevel,
};
