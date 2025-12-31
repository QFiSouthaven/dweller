
export interface ConversionSettings {
  extractProjectStructure: boolean;
  extractSourceCode: boolean;
  addDocumentation: boolean;
  refactorForBestPractices: boolean;
  enableSpliceAssembly: boolean;
  enableNeuralPersistence: boolean;
}

export type LLMProvider = 'google' | 'local';

export interface ProviderSettings {
  provider: LLMProvider;
  localBaseUrl: string;
  localModelId: string;
}

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
}

export interface SwarmMetrics {
  totalBytes: number;
  imageCount: number;
  saturation: number; // 0 to 1
  isCritical: boolean;
}

export interface StagingModule {
  id: string;
  filename: string;
  type: string;
  confidence: number;
  description: string;
  technologies: string[];
}

export interface StagingData {
  projectName: string;
  techStack: string[];
  modules: StagingModule[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  deploymentChecklist?: string[]; // Added for deployment readiness
}

export interface Checkpoint {
  id: string;
  timestamp: Date;
  result: string;
  imageCount: number;
  files: ParsedFile[];
  summary: string;
}

export interface ProcessingState {
  isLoading: boolean;
  isStaged: boolean;
  stagingData: StagingData | null;
  progress: number;
  error: string | null;
  result: string | null;
  logs: LogEntry[];
  checkpoints: Checkpoint[];
}

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  isSpliceSource?: boolean;
}

export interface ParsedFile {
  filename: string;
  language: string;
  content: string;
  missingDependencies?: string[];
}
