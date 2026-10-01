import { GoogleGenAI } from '@google/genai';
import { ILLMProvider } from './ILLMProvider';
import { ITextGenerateDTO, ITextGenerateResult } from '../../types';
import { ApiError } from '../../exceptions/ApiError';

export class GeminiProvider implements ILLMProvider {
  public name = 'gemini';
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async generateText(params: ITextGenerateDTO): Promise<ITextGenerateResult> {
    if (!this.ai) {
      throw new ApiError('Gemini API key is not configured');
    }

    const modelName = params.model || 'gemini-2.5-flash';
    let fullPrompt = params.prompt;

    // Interpolate template variables if provided
    if (params.templateVariables) {
      Object.entries(params.templateVariables).forEach(([key, val]) => {
        fullPrompt = fullPrompt.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
      });
    }

    const response = await this.ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: params.temperature ?? 0.7,
        maxOutputTokens: params.maxTokens ?? 2048,
      },
    });

    const text = response.text || '';
    return {
      text,
      provider: this.name,
      model: modelName,
      promptTokens: response.usageMetadata?.promptTokenCount,
      completionTokens: response.usageMetadata?.candidatesTokenCount,
      totalTokens: response.usageMetadata?.totalTokenCount,
    };
  }

  async generateStructuredJson<T = any>(params: ITextGenerateDTO, schema: Record<string, any>): Promise<T> {
    if (!this.ai) {
      throw new ApiError('Gemini API key is not configured');
    }

    const modelName = params.model || 'gemini-2.5-flash';
    const response = await this.ai.models.generateContent({
      model: modelName,
      contents: params.prompt,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: params.temperature ?? 0.3,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const jsonText = response.text || '{}';
    return JSON.parse(jsonText) as T;
  }
}
