/**
 * Logging service for application-wide error tracking and debugging
 *
 * In development, logs to console with formatted output.
 * In production, could be extended to send to monitoring service.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private readonly isDev = import.meta.env.DEV;
  private readonly isTest = import.meta.env.MODE === 'test';

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    return `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  }

  private log(entry: LogEntry): void {
    // Skip logging in test mode unless explicitly enabled
    if (this.isTest) return;

    if (this.isDev) {
      const formattedMessage = this.formatMessage(entry);

      switch (entry.level) {
        case 'debug':
          console.debug(formattedMessage, entry.context ?? '');
          break;
        case 'info':
          console.info(formattedMessage, entry.context ?? '');
          break;
        case 'warn':
          console.warn(formattedMessage, entry.context ?? '');
          break;
        case 'error':
          console.error(formattedMessage, entry.error ?? '', entry.context ?? '');
          break;
      }
    }

    // In production, send to monitoring service
    // if (!this.isDev && entry.level === 'error') {
    //   this.sendToMonitoring(entry);
    // }
  }

  debug(message: string, context?: LogContext): void {
    this.log({
      level: 'debug',
      message,
      timestamp: new Date(),
      context,
    });
  }

  info(message: string, context?: LogContext): void {
    this.log({
      level: 'info',
      message,
      timestamp: new Date(),
      context,
    });
  }

  warn(message: string, context?: LogContext): void {
    this.log({
      level: 'warn',
      message,
      timestamp: new Date(),
      context,
    });
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log({
      level: 'error',
      message,
      timestamp: new Date(),
      error,
      context,
    });
  }
}

export const logger = new Logger();
