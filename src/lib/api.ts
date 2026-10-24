import {
  User,
  Conversation,
  Message,
  Project,
  FileItem,
  Dataset,
  ResearchSession,
  DataAnalysisResult,
  ProviderStatus,
} from '../types';

const TOKEN_KEY = 'nexa_auth_token';

export function getStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token === 'nexa-demo-session-token-v1') {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return token;
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.statusText}`;
    try {
      const errObj = await res.json();
      if (errObj.error) errMsg = errObj.error;
    } catch {
      // Ignore
    }
    throw new Error(errMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  auth: {
    me: () => request<{ user: User }>('/api/auth/me'),
    login: (body: { email: string; password: string }) =>
      request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    register: (body: { email: string; name: string; password: string; onboardingPurpose?: string }) =>
      request<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    logout: () =>
      request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
    forgotPassword: (email: string) =>
      request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (body: { token: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateProfile: (body: Partial<User>) =>
      request<{ user: User }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },

  // Chat
  chat: {
    getConversations: (params?: { projectId?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<{ conversations: Conversation[] }>(`/api/conversations${query ? `?${query}` : ''}`);
    },
    getConversation: (id: string) =>
      request<{ conversation: Conversation; messages: Message[] }>(`/api/conversations/${id}`),
    createConversation: (body: { title?: string; model?: string; projectId?: string }) =>
      request<{ conversation: Conversation }>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateConversation: (id: string, body: Partial<Conversation>) =>
      request<{ conversation: Conversation }>(`/api/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteConversation: (id: string) =>
      request<{ success: boolean }>(`/api/conversations/${id}`, {
        method: 'DELETE',
      }),
    sendFeedback: (messageId: string, feedback: 'like' | 'dislike') =>
      request<{ success: boolean }>(`/api/messages/${messageId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
      }),
    getProviderStatus: () => request<ProviderStatus>('/api/provider-status'),
  },

  // Stream chat message via SSE
  streamChat: async (
    payload: {
      conversationId?: string;
      content: string;
      model?: string;
      attachments?: any[];
      projectId?: string;
    },
    callbacks: {
      onInit?: (conv: Conversation, userMsg: Message) => void;
      onChunk?: (text: string) => void;
      onToolCall?: (toolCall: any) => void;
      onDone?: (msg: Message) => void;
      onError?: (err: string) => void;
    }
  ) => {
    const token = getStoredToken();
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errText = 'Failed to connect to AI engine';
      try {
        const json = await res.json();
        if (json.error) errText = json.error;
      } catch {
        // Ignore
      }
      callbacks.onError?.(errText);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      callbacks.onError?.('Readable stream not supported');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim().startsWith('data: ')) {
          try {
            const data = JSON.parse(buffer.trim().slice(6));
            if (data.type === 'init') {
              callbacks.onInit?.(data.conversation, data.userMessage);
            } else if (data.type === 'chunk') {
              callbacks.onChunk?.(data.text);
            } else if (data.type === 'tool_call') {
              callbacks.onToolCall?.(data.toolCall);
            } else if (data.type === 'done') {
              callbacks.onDone?.(data.message);
            } else if (data.type === 'error') {
              callbacks.onError?.(data.error);
            }
          } catch {
            // Ignore incomplete trailing snippet
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        const trimmed = block.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === 'init') {
              callbacks.onInit?.(data.conversation, data.userMessage);
            } else if (data.type === 'chunk') {
              callbacks.onChunk?.(data.text);
            } else if (data.type === 'tool_call') {
              callbacks.onToolCall?.(data.toolCall);
            } else if (data.type === 'done') {
              callbacks.onDone?.(data.message);
            } else if (data.type === 'error') {
              callbacks.onError?.(data.error);
            }
          } catch {
            // Partial JSON ignore
          }
        }
      }
    }
  },

  // Datasets
  datasets: {
    list: (params?: Record<string, string | undefined>) => {
      const cleanParams: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined) cleanParams[k] = v;
        });
      }
      const query = new URLSearchParams(cleanParams).toString();
      return request<{ datasets: Dataset[]; total: number; categoriesCount: Record<string, number> }>(
        `/api/datasets${query ? `?${query}` : ''}`
      );
    },
    get: (id: string) => request<{ dataset: Dataset; related: Dataset[] }>(`/api/datasets/${id}`),
    search: (q: string) => request<{ results: Dataset[] }>(`/api/datasets/search?q=${encodeURIComponent(q)}`),
  },

  // Data Analysis
  data: {
    analyze: (body: { data?: any[]; rawText?: string; filename?: string }) =>
      request<DataAnalysisResult>('/api/data/analyze', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    query: (body: { question: string; datasetProfile: DataAnalysisResult }) =>
      request<{ answer: string; provider?: string }>('/api/data/query', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  // Research
  research: {
    list: () => request<{ sessions: ResearchSession[] }>('/api/research'),
    get: (id: string) => request<{ session: ResearchSession }>(`/api/research/${id}`),
    start: (body: { query: string; projectId?: string }) =>
      request<{ session: ResearchSession }>('/api/research', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  // Files
  files: {
    list: (projectId?: string) =>
      request<{ files: FileItem[] }>(`/api/files${projectId ? `?projectId=${projectId}` : ''}`),
    get: (id: string) => request<{ file: FileItem }>(`/api/files/${id}`),
    upload: (body: { name: string; content: string; mimeType: string; size?: number; projectId?: string }) =>
      request<{ file: FileItem }>('/api/files', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    delete: (id: string) => request<{ success: boolean }>(`/api/files/${id}`, { method: 'DELETE' }),
    summarize: (id: string) =>
      request<{ summary: string; provider?: string }>(`/api/files/${id}/summarize`, { method: 'POST' }),
    ask: (id: string, question: string) =>
      request<{ answer: string; provider?: string }>(`/api/files/${id}/ask`, {
        method: 'POST',
        body: JSON.stringify({ question }),
      }),
  },

  // Projects
  projects: {
    list: () => request<{ projects: Project[] }>('/api/projects'),
    get: (id: string) =>
      request<{ project: Project; conversations: Conversation[]; files: FileItem[]; research: ResearchSession[] }>(
        `/api/projects/${id}`
      ),
    create: (body: { name: string; description?: string; color?: string }) =>
      request<{ project: Project }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<Project>) =>
      request<{ project: Project }>(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: string) => request<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),
  },

  // Tools
  tools: {
    list: () => request<{ tools: any[] }>('/api/tools'),
    execute: (toolName: string, input: any) =>
      request<{ success: boolean; result: any }>('/api/tools/execute', {
        method: 'POST',
        body: JSON.stringify({ toolName, input }),
      }),
  },
};
