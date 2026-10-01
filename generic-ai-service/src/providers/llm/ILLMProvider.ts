import { ITextGenerateDTO, ITextGenerateResult } from '../../types';

export interface ILLMProvider {
  name: string;
  generateText(params: ITextGenerateDTO): Promise<ITextGenerateResult>;
  generateStructuredJson<T = any>(params: ITextGenerateDTO, schema: Record<string, any>): Promise<T>;
}
