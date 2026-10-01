import { ILLMProvider } from '../providers/llm/ILLMProvider';
import { GeminiProvider } from '../providers/llm/GeminiProvider';
import { OpenAIProvider } from '../providers/llm/OpenAIProvider';
import { MockLLMProvider } from '../providers/llm/MockLLMProvider';
import {
  ITextGenerateDTO,
  ITextGenerateResult,
  IChatGPTRequestDTO,
  IChatGPTResponseDTO,
} from '../types';

export class LLMService {
  private providers: Map<string, ILLMProvider> = new Map();
  private openAIProvider: OpenAIProvider;

  constructor() {
    this.openAIProvider = new OpenAIProvider();
    this.registerProvider(this.openAIProvider);
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new MockLLMProvider());
  }

  public registerProvider(provider: ILLMProvider) {
    this.providers.set(provider.name, provider);
  }

  private getProvider(preferred?: string): ILLMProvider {
    if (preferred && this.providers.has(preferred)) {
      return this.providers.get(preferred)!;
    }
    // Check OpenAI or Gemini
    if (process.env.OPENAI_API_KEY && this.providers.has('openai')) {
      return this.providers.get('openai')!;
    }
    if (process.env.GEMINI_API_KEY && this.providers.has('gemini')) {
      return this.providers.get('gemini')!;
    }
    return this.providers.get('mock')!;
  }

  async generateText(params: ITextGenerateDTO): Promise<ITextGenerateResult> {
    const provider = this.getProvider(params.provider);
    return await provider.generateText(params);
  }

  async generateStructuredJson<T = any>(params: ITextGenerateDTO, schema: Record<string, any>): Promise<T> {
    const provider = this.getProvider(params.provider);
    return await provider.generateStructuredJson<T>(params, schema);
  }

  async chat(params: IChatGPTRequestDTO): Promise<IChatGPTResponseDTO> {
    return await this.openAIProvider.chat(params);
  }
}

export default new LLMService();
