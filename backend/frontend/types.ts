export interface TemplateCard {
  title: string;
  category: string;
  tags: string[];
  relevanceScore: number; // 0-100
}

export interface WorkflowData {
  templates: TemplateCard[];
  workflowJson: Record<string, any>;
  summary: string;
}

export interface GenerationRequest {
  prompt: string;
  topK: number;
  useExternalInfo: boolean;
  externalUrls: string;
  videoFile?: File | null; // Added for video analysis
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING', // Analyzing video/prompt
  PLANNING = 'PLANNING',   // Chat/Confirmation phase
  GENERATING = 'GENERATING', // Creating JSON
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum DeployStatus {
  IDLE = 'IDLE',
  DEPLOYING = 'DEPLOYING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type Language = 'en' | 'ja';
