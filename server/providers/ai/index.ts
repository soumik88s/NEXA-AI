import { GeminiProvider } from './gemini';
import { DevFallbackProvider } from './fallback';
import { OpenAICompatibleProvider } from './openai';
import { AIProvider } from './types';

const gemini = new GeminiProvider();
const openai = new OpenAICompatibleProvider();
const fallback = new DevFallbackProvider();

class ResilientAIProvider implements AIProvider {
  public name: string;
  private primary: AIProvider;
  private fallback: AIProvider;

  constructor(primary: AIProvider, fallback: AIProvider) {
    this.primary = primary;
    this.fallback = fallback;
    this.name = primary.name;
  }

  isAvailable(): boolean {
    return true;
  }

  async generateChat(options: any) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI Provider timeout (25s)')), 25000)
      );
      return (await Promise.race([this.primary.generateChat(options), timeoutPromise])) as any;
    } catch (err: any) {
      console.warn(`[AI] Primary provider failed: ${err.message}`);
      if (process.env.DEV_AI_PROVIDER === 'true') {
        console.warn('[AI] DEV_AI_PROVIDER=true; using local fallback.');
        return await this.fallback.generateChat(options);
      }
      throw err;
    }
  }

  async streamChat(options: any, onChunk: any) {
    let receivedChunk = false;
    try {
      const wrappedOnChunk = (chunk: any) => {
        receivedChunk = true;
        onChunk(chunk);
      };

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          if (!receivedChunk) reject(new Error('AI stream connection timeout (25s)'));
        }, 25000)
      );

      return (await Promise.race([
        this.primary.streamChat(options, wrappedOnChunk),
        timeoutPromise,
      ])) as any;
    } catch (err: any) {
      console.warn(`[AI] Primary provider failed: ${err.message}`);
      if (process.env.DEV_AI_PROVIDER === 'true') {
        console.warn('[AI] DEV_AI_PROVIDER=true; using local fallback.');
        if (receivedChunk) {
          onChunk({ done: true });
          return { content: '', provider: this.primary.name, model: options.model };
        }
        return await this.fallback.streamChat(options, onChunk);
      }
      if (receivedChunk) {
        onChunk({ done: true });
        return { content: '', provider: this.primary.name, model: options.model };
      }
      throw err;
    }
  }
}

export function getAIProvider(preferred?: string): AIProvider {
  if (preferred === 'openai' && openai.isAvailable()) {
    return new ResilientAIProvider(openai, fallback);
  }
  if (gemini.isAvailable()) {
    return new ResilientAIProvider(gemini, fallback);
  }
  if (openai.isAvailable()) {
    return new ResilientAIProvider(openai, fallback);
  }
  if (process.env.DEV_AI_PROVIDER === 'true') {
    console.warn('[AI] No remote provider configured; DEV_AI_PROVIDER=true so local fallback is active.');
    return fallback;
  }
  return {
    name: 'AI provider not configured',
    isAvailable: () => false,
    async generateChat() {
      throw new Error('No AI provider is configured. Set GEMINI_API_KEY in .env and restart the server.');
    },
    async streamChat(_options: any, onChunk: any) {
      const message = 'No AI provider is configured. Set GEMINI_API_KEY in .env and restart the server.';
      onChunk({ text: message });
      onChunk({ done: true });
      throw new Error(message);
    },
  } as AIProvider;
}

export function getProviderStatus() {
  return {
    gemini: gemini.isAvailable(),
    openai: openai.isAvailable(),
    fallbackActive: !gemini.isAvailable() && !openai.isAvailable(),
    activeProviderName: getAIProvider().name,
  };
}

export * from './types';
