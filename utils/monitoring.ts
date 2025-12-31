import { LogEntry, LogLevel, UploadedImage, SwarmMetrics } from '../types';

export interface ErrorClassification {
  title: string;
  message: string;
  code: string;
  action?: {
    label: string;
    type: 'retry' | 'config' | 'billing' | 'refresh';
  };
}

const MEMORY_LIMIT = 1.5 * 1024 * 1024 * 1024; // 1.5 GB

export class Monitor {
  private static logs: LogEntry[] = [];
  private static listeners: ((logs: LogEntry[]) => void)[] = [];

  static log(level: LogLevel, message: string, details?: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      level,
      message,
      details
    };
    this.logs = [entry, ...this.logs].slice(0, 100);
    this.notify();
    
    if (level === 'error') console.error(`[CRITICAL] ${message}`, details);
  }

  static calculateMetrics(images: UploadedImage[]): SwarmMetrics {
    let totalBytes = 0;
    
    images.forEach(img => {
      // 1. Raw binary file size
      totalBytes += img.file.size;
      
      // 2. Base64 encoding overhead (~33%)
      totalBytes += img.base64.length;
      
      // 3. Heuristic: Browser bitmap expansion in RAM 
      // Most screenshots are ~1920x1080. We add a conservative 8MB per image for rendered buffers.
      totalBytes += (8 * 1024 * 1024); 
    });

    const saturation = Math.min(totalBytes / MEMORY_LIMIT, 1);

    return {
      totalBytes,
      imageCount: images.length,
      saturation,
      isCritical: totalBytes >= MEMORY_LIMIT
    };
  }

  static subscribe(callback: (logs: LogEntry[]) => void) {
    this.listeners.push(callback);
    callback(this.logs);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private static notify() {
    this.listeners.forEach(l => l(this.logs));
  }

  static classifyError(error: any): ErrorClassification {
    const msg = error?.message || String(error);
    const lowMsg = msg.toLowerCase();

    if (lowMsg.includes('api_key') || lowMsg.includes('unauthorized') || lowMsg.includes('401')) {
      return { 
        title: 'Authentication Void', 
        message: 'The neural link requires a valid API Key.', 
        code: 'AUTH_001',
        action: { label: 'Verify Key Settings', type: 'config' }
      };
    }
    if (lowMsg.includes('quota') || lowMsg.includes('429') || lowMsg.includes('exhausted')) {
      return { 
        title: 'Bandwidth Saturated', 
        message: 'Rate limit hit. The swarm is over capacity.', 
        code: 'SWARM_429',
        action: { label: 'Wait 60s & Retry', type: 'retry' }
      };
    }
    
    return { 
      title: 'Logic Processor Fault', 
      message: msg || 'An unhandled exception occurred during modular synthesis.', 
      code: 'SYS_ERR_UNKNOWN' 
    };
  }
}