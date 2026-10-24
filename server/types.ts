export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  role: string;
  onboardingPurpose?: string;
  themePreference: string;
  modelPreference: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  projectId?: string | null;
  title: string;
  model: string;
  systemPrompt?: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url?: string;
  content?: string;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  snippet: string;
  publisher?: string;
}

export interface ToolCall {
  tool: string;
  input: any;
  output?: any;
  status: 'running' | 'success' | 'failed';
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  citations?: Citation[];
  toolCalls?: ToolCall[];
  provider?: string;
  model?: string;
  tokensUsed?: number;
  feedback?: 'like' | 'dislike' | null;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  status: 'active' | 'archived';
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  userId: string;
  projectId?: string | null;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path?: string;
  extractedText?: string;
  metadata?: Record<string, any>;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  publisher: string;
  country?: string;
  region?: string;
  organization?: string;
  category: string;
  topic?: string;
  year?: number;
  license?: string;
  format: string; // CSV, JSON, GeoJSON, Parquet, API
  apiAvailable: boolean;
  downloadUrl?: string;
  sourceUrl: string;
  updateFrequency?: string;
  geographicCoverage?: string;
  timeCoverage?: string;
  recordCount?: number;
  columns?: Array<{ name: string; type: string; description?: string }>;
  sampleData?: any[];
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchSession {
  id: string;
  userId: string;
  projectId?: string | null;
  topic: string;
  query: string;
  plan: Array<{ step: number; task: string; status: 'pending' | 'in_progress' | 'completed' }>;
  status: 'planning' | 'gathering' | 'synthesizing' | 'completed' | 'failed';
  synthesis?: string;
  uncertainty?: string;
  sources: ResearchSource[];
  createdAt: string;
  updatedAt: string;
}

export interface ResearchSource {
  id: string;
  researchSessionId: string;
  title: string;
  publisher: string;
  date?: string;
  url: string;
  excerpt: string;
  sourceType: 'government' | 'academic' | 'international_body' | 'web';
  reliability: number;
  createdAt: string;
}

