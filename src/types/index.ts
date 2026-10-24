export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  onboardingPurpose?: string;
  themePreference: string;
  modelPreference: string;
  createdAt: string;
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

export interface Conversation {
  id: string;
  userId: string;
  projectId?: string | null;
  title: string;
  model: string;
  systemPrompt?: string;
  isPinned: boolean;
  messageCount?: number;
  lastMessage?: { content: string; createdAt: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  status: 'active' | 'archived';
  color?: string;
  chatCount?: number;
  fileCount?: number;
  researchCount?: number;
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
  format: string;
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

export interface ProviderStatus {
  gemini: boolean;
  openai: boolean;
  fallbackActive: boolean;
  activeProviderName: string;
}

export interface ColumnStat {
  name: string;
  type: 'numeric' | 'categorical';
  total: number;
  missing: number;
  missingRate: number;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  q1?: number;
  q3?: number;
  outlierCount?: number;
  uniqueCount?: number;
  topCategories?: string[];
}

export interface DataAnalysisResult {
  filename: string;
  rows: number;
  columns: string[];
  totalCells: number;
  totalMissing: number;
  duplicateCount: number;
  qualityScore: number;
  columnStats: Record<string, ColumnStat>;
  preview: any[];
  aiExplanation?: string;
}

