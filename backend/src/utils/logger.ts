// backend/src/utils/logger.ts
// ============================================================
// Centralized Logging Utility
// ============================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isDebugEnabled = process.env.DEBUG === 'true';

  /**
   * Format log output with timestamp and context
   */
  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDebugEnabled) {
      console.debug(this.formatLog('debug', message, context));
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    console.log(this.formatLog('info', message, context));
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('warn', message, context));
  }

  /**
   * Error level logging with stack trace
   */
  error(message: string, error: Error | any, context?: LogContext): void {
    const stack = this.isDevelopment && error?.stack ? `\n${error.stack}` : '';
    console.error(this.formatLog('error', message, context) + stack);
  }

  /**
   * Log API request
   */
  logRequest(method: string, path: string, context?: LogContext): void {
    this.info(`${method} ${path}`, context);
  }

  /**
   * Log API response
   */
  logResponse(
    method: string,
    path: string,
    status: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = status >= 400 ? 'warn' : 'info';
    const logFn = level === 'warn' ? this.warn : this.info;
    logFn.call(
      this,
      `${method} ${path} ${status} (${duration}ms)`,
      context
    );
  }

  /**
   * Log database operation
   */
  logDatabase(operation: string, table: string, duration: number, context?: LogContext): void {
    this.debug(`[DB] ${operation} ${table} (${duration}ms)`, context);
  }

  /**
   * Create a child logger with a namespace
   */
  child(namespace: string): NamespacedLogger {
    return new NamespacedLogger(namespace, this);
  }
}

/**
 * Namespaced logger for easier categorization
 */
class NamespacedLogger {
  constructor(
    private namespace: string,
    private logger: Logger
  ) {}

  private prefixMessage(message: string): string {
    return `[${this.namespace}] ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(this.prefixMessage(message), context);
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(this.prefixMessage(message), context);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(this.prefixMessage(message), context);
  }

  error(message: string, error: Error | any, context?: LogContext): void {
    this.logger.error(this.prefixMessage(message), error, context);
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Usage Examples:
 *
 * // Simple logging
 * logger.info('Server started', { port: 3000 });
 *
 * // With context
 * logger.info('User created', { userId: '123', email: 'user@example.com' });
 *
 * // Errors
 * try {
 *   await database.query();
 * } catch (err) {
 *   logger.error('Database query failed', err, { query: 'SELECT...' });
 * }
 *
 * // Namespaced logger
 * const controllerLogger = logger.child('FixtureController');
 * controllerLogger.info('Generating fixtures', { league: 'PL' });
 *
 * // API request/response logging
 * const startTime = Date.now();
 * logger.logRequest('POST', '/api/fpl/optimize');
 * // ... do work ...
 * logger.logResponse('POST', '/api/fpl/optimize', 200, Date.now() - startTime);
 */
