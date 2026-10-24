import OpenAI from 'openai';
import { ILLMProvider } from './ILLMProvider';
import {
  ITextGenerateDTO,
  ITextGenerateResult,
} from '../../types';
import { ApiError } from '../../exceptions/ApiError';
import logger from '../../logger';

export class GroqProvider implements ILLMProvider {
  public name = 'groq';
  private client: OpenAI | null = null;
  private defaultModel: string;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    this.defaultModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      logger.info(`⚡ [GroqProvider] Initialized with Groq LPU endpoint (defaultModel=${this.defaultModel})`);
    } else {
      logger.warn(`⚠️ [GroqProvider] GROQ_API_KEY not configured. Provider will simulate responses in non-production.`);
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
        logger.warn(`[GroqProvider] Groq client not configured; returning simulated response in non-prod`);
        return {
          text: `[Offline Simulation] Response to: "${fullPrompt.slice(0, 80)}..."`,
          provider: this.name,
          model,
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        };
      }
      throw new ApiError('Groq API key is not configured');
    }

    const startTime = Date.now();
    logger.debug(`[GroqProvider] Calling Groq chat.completions.create with model=${model}`);

    const createParams: any = {
      model,
      messages,
      temperature: params.temperature ?? 0.8,
      max_completion_tokens: params.maxTokens ?? 2048,
    };

    // If model supports reasoning effort (e.g. gpt-oss-120b), supply default effort
    if (model.includes('120b')) {
      createParams.reasoning_effort = 'medium';
    }

    let response: any;
    try {
      response = await this.client.chat.completions.create(createParams);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      // Retry without reasoning_effort if rejected by model
      if (errMsg.toLowerCase().includes('reasoning_effort') && createParams.reasoning_effort) {
        delete createParams.reasoning_effort;
        response = await this.client.chat.completions.create(createParams);
      } else if (errMsg.toLowerCase().includes('otpm') || errMsg.toLowerCase().includes('reduce max_tokens')) {
        logger.warn(`[GroqProvider] OTPM token limit exceeded. Auto-clamping to 850 tokens and retrying...`);
        createParams.max_completion_tokens = 850;
        response = await this.client.chat.completions.create(createParams);
      } else {
        throw err;
      }
    }

    const duration = Date.now() - startTime;
    logger.debug(`[GroqProvider] Received completion from Groq LPU in ${duration}ms (totalTokens=${response.usage?.total_tokens || 0})`);

    const choice = response.choices[0];
    const text = choice?.message?.content || '';
    const finishReason = choice?.finish_reason || 'stop';
    return {
      text,
      provider: this.name,
      model: response.model || model,
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
      totalTokens: response.usage?.total_tokens,
      finishReason,
    };
  }

  async generateStructuredJson<T = any>(params: ITextGenerateDTO, schema: Record<string, any>): Promise<T> {
    const model = params.model || this.defaultModel;

    if (!this.client) {
      if (process.env.NODE_ENV !== 'production') {
        return {} as T;
      }
      throw new ApiError('Groq API key is not configured');
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (params.systemInstruction) {
      messages.push({ role: 'system', content: params.systemInstruction });
    }
    messages.push({
      role: 'user',
      content: `${params.prompt}\nRespond strictly with valid JSON conforming to this schema:\n${JSON.stringify(schema)}`,
    });

    const createParams: any = {
      model,
      messages,
      response_format: { type: 'json_object' },
      temperature: params.temperature ?? 0.5,
      max_completion_tokens: params.maxTokens ?? 2048,
    };

    const response = await this.client.chat.completions.create(createParams);
    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content) as T;
  }
}
