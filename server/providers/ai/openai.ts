import 'dotenv/config';
import { AIProvider, ChatOptions, ChatResult } from './types';

export class OpenAICompatibleProvider implements AIProvider {
  public name = 'OpenAI Compatible';
  private apiKey: string | undefined;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  async generateChat(options: ChatOptions): Promise<ChatResult> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI provider is not configured. OPENAI_API_KEY missing.');
    }

    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model === 'NEXA Reason' ? 'o1-mini' : 'gpt-4o',
        messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error: ${err}`);
    }

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      provider: 'OpenAI',
      model: data.model || options.model,
      tokensUsed: data.usage?.total_tokens || 100,
    };
  }

  async streamChat(
    options: ChatOptions,
    onChunk: (chunk: { text?: string; done?: boolean }) => void
  ): Promise<ChatResult> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI provider is not configured. OPENAI_API_KEY missing.');
    }

    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model === 'NEXA Reason' ? 'o1-mini' : 'gpt-4o',
        messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const err = await res.text();
      throw new Error(`OpenAI API stream error: ${err}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              onChunk({ text: delta });
            }
          } catch {
            // Ignore parse errors on partial chunks
          }
        }
      }
    }
    onChunk({ done: true });

    return {
      content: fullText,
      provider: 'OpenAI',
      model: options.model,
      tokensUsed: Math.ceil(fullText.length / 4),
    };
  }
}
