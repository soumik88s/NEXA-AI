import { Attachment, Citation, ToolCall } from '../../types';

export interface ChatMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
}

export interface ChatOptions {
  messages: ChatMessageInput[];
  model: string;
  systemPrompt?: string;
  temperature?: number;
  attachments?: Attachment[];
  enableTools?: boolean;
}

export interface ChatResult {
  content: string;
  provider: string;
  model: string;
  citations?: Citation[];
  toolCalls?: ToolCall[];
  tokensUsed?: number;
}

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  generateChat(options: ChatOptions): Promise<ChatResult>;
  streamChat(
    options: ChatOptions,
    onChunk: (chunk: { text?: string; toolCall?: ToolCall; citation?: Citation; done?: boolean }) => void
  ): Promise<ChatResult>;
}
