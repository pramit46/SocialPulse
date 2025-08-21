import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  category: string;
  message: string;
  metadata?: any;
}

class Logger {
  private logDir: string;
  private currentLogFile: string;
  private currentDate: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.currentDate = this.getDateString();
    this.currentLogFile = path.join(this.logDir, `app-${this.currentDate}.log`);
    this.ensureLogDirectory();
    this.scheduleLogRotation();
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private scheduleLogRotation(): void {
    // Calculate milliseconds until midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    // Schedule first rotation at midnight
    setTimeout(() => {
      this.rotateLog();
      // Then rotate daily
      setInterval(() => {
        this.rotateLog();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, msUntilMidnight);
  }

  private rotateLog(): void {
    const newDate = this.getDateString();
    if (newDate !== this.currentDate) {
      this.currentDate = newDate;
      this.currentLogFile = path.join(this.logDir, `app-${this.currentDate}.log`);
      this.log('INFO', 'SYSTEM', 'Log file rotated to new day');
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const metaStr = entry.metadata ? ` | ${JSON.stringify(entry.metadata)}` : '';
    return `${entry.timestamp} [${entry.level}] [${entry.category}] ${entry.message}${metaStr}\n`;
  }

  public log(level: LogEntry['level'], category: string, message: string, metadata?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata
    };

    const logLine = this.formatLogEntry(entry);
    
    // Write to file
    fs.appendFileSync(this.currentLogFile, logLine);
    
    // Also log to console with appropriate method
    const consoleMessage = `${entry.timestamp} [${category}] ${message}`;
    switch (level) {
      case 'ERROR':
        console.error(consoleMessage, metadata || '');
        break;
      case 'WARN':
        console.warn(consoleMessage, metadata || '');
        break;
      case 'DEBUG':
        console.debug(consoleMessage, metadata || '');
        break;
      default:
        console.log(consoleMessage, metadata || '');
    }
  }

  // Convenience methods
  info(category: string, message: string, metadata?: any): void {
    this.log('INFO', category, message, metadata);
  }

  warn(category: string, message: string, metadata?: any): void {
    this.log('WARN', category, message, metadata);
  }

  error(category: string, message: string, metadata?: any): void {
    this.log('ERROR', category, message, metadata);
  }

  debug(category: string, message: string, metadata?: any): void {
    this.log('DEBUG', category, message, metadata);
  }

  // MongoDB specific logging
  mongodb(message: string, metadata?: any): void {
    this.log('INFO', 'MONGODB', message, metadata);
  }

  // ChromaDB specific logging
  chromadb(message: string, metadata?: any): void {
    this.log('INFO', 'CHROMADB', message, metadata);
  }

  // AVA specific logging
  ava(message: string, metadata?: any): void {
    this.log('INFO', 'AVA', message, metadata);
  }

  // API specific logging
  api(message: string, metadata?: any): void {
    this.log('INFO', 'API', message, metadata);
  }
}

export const logger = new Logger();