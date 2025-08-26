/**
 * Simple structured logging utility
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, data, error } = entry;
    
    if (this.isDevelopment) {
      // Human-readable format for development
      let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      
      if (data) {
        log += `\nData: ${JSON.stringify(data, null, 2)}`;
      }
      
      if (error) {
        log += `\nError: ${error.message}`;
        if (error.stack) {
          log += `\nStack: ${error.stack}`;
        }
      }
      
      return log;
    } else {
      // JSON format for production
      return JSON.stringify({
        timestamp,
        level,
        message,
        data,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : undefined
      });
    }
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error
    };

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
    }
  }

  error(message: string, data?: any, error?: Error): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  // Request logging helpers
  logRequest(method: string, url: string, headers?: any, body?: any): void {
    this.info('API Request', {
      method,
      url,
      headers: this.sanitizeHeaders(headers),
      body: body ? JSON.stringify(body).substring(0, 500) : undefined
    });
  }

  logResponse(statusCode: number, url: string, responseTime?: number, data?: any): void {
    this.info('API Response', {
      statusCode,
      url,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      dataSize: data ? JSON.stringify(data).length : 0
    });
  }

  logError(error: Error, context?: string, data?: any): void {
    this.error(`${context || 'Error'}: ${error.message}`, data, error);
  }

  private sanitizeHeaders(headers?: any): any {
    if (!headers) return undefined;
    
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    if (sanitized.authorization) {
      sanitized.authorization = 'Bearer ***';
    }
    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer ***';
    }
    
    return sanitized;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };