import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { AIProvider, ChatOptions, ChatResult } from './types';

export class GeminiProvider implements AIProvider {
  public name = 'Google Gemini (Official SDK)';
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.initClient();
  }

  private initClient() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (err: any) {
        console.error('[AI] Gemini client initialization error:', err.message);
        this.ai = null;
      }
    } else {
      console.warn('[AI] API key is missing (GEMINI_API_KEY)');
    }
  }

  isAvailable(): boolean {
    const key = process.env.GEMINI_API_KEY?.trim();
    return !!key && key !== 'MY_GEMINI_API_KEY';
  }

  private getClient(): GoogleGenAI {
    if (!this.ai) {
      this.initClient();
    }
    if (!this.ai) {
      console.warn('[AI] API key is missing');
      throw new Error('Gemini API is not configured. Create a .env file in the project root and set GEMINI_API_KEY to a valid Google AI Studio API key.');
    }
    return this.ai;
  }

  private getCandidateModels(requestedModel: string): string[] {
    // Priority order: responsive, active models first
    switch (requestedModel) {
      case 'NEXA Reason':
        return ['gemini-3.1-pro-preview', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
      case 'NEXA Fast':
        return ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      case 'NEXA Research':
        return ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'];
      case 'NEXA Vision':
        return ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
      case 'NEXA Auto':
      default:
        return ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    }
  }

  private buildContents(options: ChatOptions) {
    return options.messages.map((m) => {
      const parts: any[] = [];

      // Attachments handling
      if (m.attachments && m.attachments.length > 0) {
        for (const att of m.attachments) {
          if (att.content && att.content.startsWith('data:')) {
            const matches = att.content.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches) {
              parts.push({
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2],
                },
              });
            }
          }
        }
      }

      parts.push({ text: m.content || ' ' });
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });
  }

  private getSystemInstruction(customPrompt?: string): string {
    const now = new Date();
    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(now);
    const dateStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(now);

    const timeContext = `\n\nREAL-TIME TEMPORAL CONTEXT (Asia/Kolkata timezone):\n- Current Time: ${timeStr} IST\n- Current Date: ${dateStr}\nIf asked for the current time or date, answer directly using this local time (e.g. "The current time is ${timeStr} IST.").`;

    const base =
      customPrompt ||
      'You are NEXA AI, an intelligent, helpful, universal workspace assistant. Provide clear, accurate, rigorous, and beautifully formatted answers with markdown headers, tables, code blocks, or mathematical notation where appropriate. Directly answer the user question.';

    return base + timeContext;
  }

  async generateChat(options: ChatOptions): Promise<ChatResult> {
    const ai = this.getClient();
    const candidateModels = this.getCandidateModels(options.model);
    const contents = this.buildContents(options);

    const config: any = {
      systemInstruction: this.getSystemInstruction(options.systemPrompt),
    };

    let lastError: any = null;
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: contents as any,
          config,
        });

        if (response.text) {
          return {
            content: response.text,
            provider: 'Gemini',
            model,
            tokensUsed: Math.ceil(response.text.length / 4),
          };
        }
      } catch (err: any) {
        console.warn(`[AI] Gemini model ${model} failed (${err.message}), trying next candidate...`);
        lastError = err;
      }
    }

    throw lastError || new Error('All Gemini candidate models failed to generate response');
  }

  async streamChat(
    options: ChatOptions,
    onChunk: (chunk: { text?: string; done?: boolean }) => void
  ): Promise<ChatResult> {
    const ai = this.getClient();
    const candidateModels = this.getCandidateModels(options.model);
    const contents = this.buildContents(options);

    const config: any = {
      systemInstruction: this.getSystemInstruction(options.systemPrompt),
    };

    let lastError: any = null;
    for (const model of candidateModels) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model,
          contents: contents as any,
          config,
        });

        let fullText = '';
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              fullText += text;
              onChunk({ text });
            }
          }
        } catch (streamErr: any) {
          // If we already received chunks (e.g. trailing "Incomplete JSON segment at the end"),
          // the generation completed successfully, so do NOT fail over to another model!
          if (fullText.length > 0) {
            console.log(
              `[Gemini Stream] Model ${model} finished with trailing SDK boundary notice (${streamErr.message}). Successfully delivered ${fullText.length} characters.`
            );
            onChunk({ done: true });
            return {
              content: fullText,
              provider: 'Gemini',
              model,
              tokensUsed: Math.ceil(fullText.length / 4),
            };
          }
          // If 0 characters were received, rethrow to try next candidate model
          throw streamErr;
        }

        if (fullText.length > 0) {
          onChunk({ done: true });
          return {
            content: fullText,
            provider: 'Gemini',
            model,
            tokensUsed: Math.ceil(fullText.length / 4),
          };
        }
      } catch (err: any) {
        console.warn(`[Gemini Stream] Model ${model} failed (${err.message}), trying next candidate...`);
        lastError = err;
      }
    }

    throw lastError || new Error('All Gemini streaming models failed');
  }
}
