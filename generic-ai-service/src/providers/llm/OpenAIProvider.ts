import OpenAI from 'openai';
import { ILLMProvider } from './ILLMProvider';
import {
  ITextGenerateDTO,
  ITextGenerateResult,
  IChatGPTRequestDTO,
  IChatGPTResponseDTO,
  IChatMessage,
} from '../../types';
import { ApiError } from '../../exceptions/ApiError';
import logger from '../../logger';

export class OpenAIProvider implements ILLMProvider {
  public name = 'openai';
  private client: OpenAI | null = null;
  private defaultModel: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async generateText(params: ITextGenerateDTO): Promise<ITextGenerateResult> {
    const model = params.model || this.defaultModel;
    let fullPrompt = params.prompt;

    if (params.templateVariables) {
      Object.entries(params.templateVariables).forEach(([key, val]) => {
        fullPrompt = fullPrompt.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
      });
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (params.systemInstruction) {
      messages.push({ role: 'system', content: params.systemInstruction });
    }
    messages.push({ role: 'user', content: fullPrompt });

    if (!this.client) {
      if (process.env.NODE_ENV !== 'production') {
        logger.warn(`[OpenAIProvider] OpenAI client not configured; returning simulated response in non-prod`);
        return {
          text: `[Offline Simulation] Response to: "${fullPrompt.slice(0, 80)}..."`,
          provider: this.name,
          model,
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        };
      }
      throw new ApiError('OpenAI API key is not configured');
    }

    const startTime = Date.now();
    logger.debug(`[OpenAIProvider] Calling chat.completions.create with model=${model}`);
    const response = await this.client.chat.completions.create({
      model,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2048,
    });
    const duration = Date.now() - startTime;
    logger.debug(`[OpenAIProvider] Received completion from OpenAI in ${duration}ms (totalTokens=${response.usage?.total_tokens || 0})`);

    const text = response.choices[0]?.message?.content || '';
    return {
      text,
      provider: this.name,
      model: response.model || model,
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
      totalTokens: response.usage?.total_tokens,
    };
  }

  async generateStructuredJson<T = any>(params: ITextGenerateDTO, schema: Record<string, any>): Promise<T> {
    const model = params.model || this.defaultModel;

    if (!this.client) {
      if (process.env.NODE_ENV !== 'production') {
        return {} as T;
      }
      throw new ApiError('OpenAI API key is not configured');
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (params.systemInstruction) {
      messages.push({ role: 'system', content: params.systemInstruction });
    }
    messages.push({
      role: 'user',
      content: `${params.prompt}\nRespond strictly with valid JSON conforming to this JSON Schema:\n${JSON.stringify(schema)}`,
    });

    const response = await this.client.chat.completions.create({
      model,
      messages,
      response_format: { type: 'json_object' },
      temperature: params.temperature ?? 0.3,
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content) as T;
  }

  /**
   * Direct ChatGPT wrapper: takes input text/messages and returns output text
   */
  async chat(params: IChatGPTRequestDTO): Promise<IChatGPTResponseDTO> {
    const model = params.model || this.defaultModel;
    const inputText =
      params.text ||
      params.prompt ||
      (params.messages && params.messages.length > 0
        ? params.messages[params.messages.length - 1].content
        : '');

    if (!inputText && (!params.messages || params.messages.length === 0)) {
      throw new ApiError('Missing input text or messages in request body', 400);
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }

    if (params.messages && params.messages.length > 0) {
      for (const m of params.messages) {
        messages.push({ role: m.role, content: m.content });
      }
    } else {
      messages.push({ role: 'user', content: inputText });
    }

    if (!this.client) {
      // If client not configured with API key, provide helpful feedback in non-production
      if (process.env.NODE_ENV !== 'production' || params.allowMockFallback) {
        return {
          inputText,
          outputText: `Simulated ChatGPT response to: "${inputText}". To receive live completions, set OPENAI_API_KEY in your environment.`,
          provider: 'openai-simulated',
          model,
          usage: {
            promptTokens: 12,
            completionTokens: 25,
            totalTokens: 37,
          },
        };
      }
      throw new ApiError('OPENAI_API_KEY is not configured in environment variables', 500);
    }

    const response = await this.client.chat.completions.create({
      model,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 1000,
    });

    const outputText = response.choices[0]?.message?.content || '';

    return {
      inputText,
      outputText,
      provider: this.name,
      model: response.model || model,
      usage: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      },
    };
  }
}
