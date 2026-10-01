import { ILLMProvider } from './ILLMProvider';
import { ITextGenerateDTO, ITextGenerateResult } from '../../types';

export class MockLLMProvider implements ILLMProvider {
  public name = 'mock';

  async generateText(params: ITextGenerateDTO): Promise<ITextGenerateResult> {
    const childName = params.templateVariables?.childName || 'நிலா';
    const dialect = params.templateVariables?.dialect || 'சென்னை';

    const mockTamilStory = `ஹாய் ${childName}! அப்பா இன்னைக்கு உனக்கு ஒரு சூப்பர் கதை சொல்லப் போறேன், அமைதியா கேளு... 

ஒரு நாள் சாயங்காலம், ${childName} ஜன்னல் வழியா வானத்தைப் பார்த்துட்டே இருந்தான். வானத்துல முழு நிலா ரொம்ப அழகா பளிச்சுனு வெளிச்சம் கொடுத்துட்டு இருந்துச்சு. 

நிலா கிட்ட போகணும்னு ${childName}-க்கு ரொம்ப ஆசை. உடனே ஒரு பெரிய கார்ட்போர்டு பாக்ஸ் எடுத்து, அதுல சூப்பரா நாலு சக்கரம் மாட்டி, மேல ஒரு சின்ன ராக்கெட் மாதிரி செஞ்சான். 

"பூம்... பூம்... ஜிவ்வ்வ்வ்வ்!"னு சத்தம் போட்டுட்டே ராக்கெட் மெதுவா மேல எழும்பி பறக்க ஆரம்பிச்சுது. மேகங்களைத் தாண்டி, நட்சத்திரங்களை தொட்டுக்கிட்டே ராக்கெட் நிலாவுக்கு போய்ச் சேர்ந்துச்சு. அங்க நிலா பாட்டி சிரிச்சுக்கிட்டே ஒரு டம்ளர்ல சூடான வெதுவெதுப்பான பால் கொடுத்து, "நல்ல பிள்ளையா தூங்கணும், சரியா?"னு சொன்னாங்க. 

${childName} சந்தோஷமா அந்த பாலை குடிச்சிட்டு, மெதுவா கண்களை மூடி... நல்லா தூங்கிட்டான். குட் நைட் ${childName}, ஸ்வீட் ட்ரீம்ஸ்.`;

    return {
      text: mockTamilStory,
      provider: 'mock',
      model: 'mock-bedtime-story-v1',
      totalTokens: 350,
    };
  }

  async generateStructuredJson<T = any>(params: ITextGenerateDTO, schema: Record<string, any>): Promise<T> {
    return {
      title: 'நிலாவின் நிலா பயணம்',
      theme: 'space',
      moral: 'அன்பும் கற்பனையும் எப்போதும் நம்மை நல்ல வழிக்கு கொண்டு செல்லும்',
      summary: 'ஒரு அழகான நிலா பயணம்',
    } as unknown as T;
  }
}
