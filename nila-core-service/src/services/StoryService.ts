import storyDao from '../dao/StoryDao';
import childDao from '../dao/ChildDao';
import userDao from '../dao/UserDao';
import memoryDao from '../dao/MemoryDao';
import voiceProfileDao from '../dao/VoiceProfileDao';
import aiServiceClient from './AIServiceClient';
import { IStorySchema } from '../models/Story';
import { IRequestStoryDTO } from '../types';
import { generateId } from '../utils';
import { ApiError, NotFoundError, ValidationError } from '../exceptions/ApiError';
import logger from '../logger';

export class StoryService {
  async requestStory(userId: string, dto: IRequestStoryDTO): Promise<IStorySchema> {
    logger.info(`Ã°Å¸â€œâ€“ [StoryService] Requesting story generation for user=${userId}, childId=${dto.childId}`, {
      childId: dto.childId,
      voiceId: dto.voiceId,
      theme: dto.theme,
      mood: dto.mood,
      duration: `${dto.targetDurationMinutes || 5}m`,
      calmness: dto.bedtimeCalmness,
      dialect: dto.dialect,
      model: dto.model,
      speaker: dto.speaker || dto.voiceName,
    });

    const [child, user] = await Promise.all([
      childDao.getChild(dto.childId),
      userDao.getUserById(userId),
    ]);

    if (!child) {
      throw new NotFoundError(`Child profile ${dto.childId} not found`);
    }

    const parentRelationship = user?.relationship || 'Appa';

    let aiVoiceId: string | undefined;
    let resolvedTtsProvider = dto.ttsProvider || dto.voiceProvider || dto.provider || 'sarvam';
    let resolvedSpeaker = dto.speaker || dto.voiceName;

    if (dto.voiceId) {
      logger.info(`Ã°Å¸Å½Â¤ [StoryService] Looking up voiceId="${dto.voiceId}" in DynamoDB...`);
      const voice = await voiceProfileDao.getVoice(dto.voiceId, resolvedTtsProvider);
      if (voice) {
        if (voice.aiServiceVoiceId) {
          aiVoiceId = voice.aiServiceVoiceId;
        }
        // Couple voiceId with its registered provider
        if (voice.provider || voice.voiceProvider) {
          resolvedTtsProvider = voice.provider || voice.voiceProvider || 'sarvam';
        }
        resolvedSpeaker = voice.providerVoiceId || voice.aiServiceVoiceId || voice.voiceId;
        logger.info(`Ã°Å¸Å½Â¤ [StoryService] Coupled voiceId="${dto.voiceId}" with provider="${resolvedTtsProvider}", speaker="${resolvedSpeaker}", aiVoiceId="${aiVoiceId || 'none'}"`);
      } else {
        logger.warn(`Ã¢Å¡Â Ã¯Â¸Â [StoryService] Voice profile "${dto.voiceId}" not found in DAO; retaining explicit speaker="${resolvedSpeaker || 'priya'}"`);
      }
    }

    if (!resolvedSpeaker) {
      resolvedSpeaker = 'priya';
    }

    logger.info(`Ã°Å¸Å½â„¢Ã¯Â¸Â [StoryService] Story TTS configuration: speaker="${resolvedSpeaker}", voiceId="${dto.voiceId || 'none'}", provider="${resolvedTtsProvider}"`);

    // Collect included memories
    let memorySnippet = '';
    if (dto.includeMemoryIds && dto.includeMemoryIds.length > 0) {
      const memories = await Promise.all(
        dto.includeMemoryIds.map(id => memoryDao.getMemory(id))
      );
      memorySnippet = memories
        .filter(Boolean)
        .map(m => `${m!.title}: ${m!.description}`)
        .join('. ');
    }

    const storyId = generateId('sty');
    const timestamp = new Date().toISOString();

    const dialect = dto.dialect || child.storySettings?.tamilDialect || 'Chennai';
    const targetDurationMinutes = dto.targetDurationMinutes || 5;
    const storyTheme = dto.theme || 'Bedtime Adventure';
    const storyMood = dto.mood || 'Gentle & Sleepy';
    const calmness = dto.bedtimeCalmness ?? 0.8;

    // Target word count: Spoken Tamil bedtime reading is ~100-110 words per minute
    const targetWords = targetDurationMinutes * 105;
    const minWords = targetDurationMinutes * 95;
    const maxWords = targetDurationMinutes * 115;

    // Age-appropriate cognitive guidelines
    const childAge = child.age || 5;
    let ageGuidelines = '';
    if (childAge <= 4) {
      ageGuidelines = `AGE APPROPRIATE LEVEL (Age ${childAge} - Toddler):
- Keep concepts very simple, comforting, sensory, and repetitive.
- Use soft sounds and warm sensory descriptions (Ã Â®Â®Ã Â¯â€ Ã Â®Â¤Ã Â¯ÂÃ Â®ÂµÃ Â®Â¾, Ã Â®ÂªÃ Â®Â³Ã Â®ÂªÃ Â®Â³Ã Â®Â©Ã Â¯ÂÃ Â®Â©Ã Â¯Â, Ã Â®ÂªÃ Â®Å¾Ã Â¯ÂÃ Â®Å¡Ã Â¯Â Ã Â®ÂªÃ Â¯â€¹Ã Â®Â², Ã Â®ÂµÃ Â¯â€ Ã Â®Â¤Ã Â¯ÂÃ Â®ÂµÃ Â¯â€ Ã Â®Â¤Ã Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¾).
- Short, simple sentences with soothing spoken cadence.`;
    } else if (childAge <= 7) {
      ageGuidelines = `AGE APPROPRIATE LEVEL (Age ${childAge} - Early Childhood):
- Engaging story with curiosity, friendly animal dialogue, gentle wonder, and cozy resolution.
- Familiar, relatable day-to-day concepts mixed with bedtime charm.`;
    } else {
      ageGuidelines = `AGE APPROPRIATE LEVEL (Age ${childAge} - Older Child):
- Richer imaginative adventure, gentle clever humor, relatable emotions, and a deeply satisfying peaceful finish.`;
    }

    // Protagonist governance
    const useChildName = dto.includeChildName !== false;
    const protagonistInstruction = useChildName
      ? `PROTAGONIST: The hero is ${child.name}. Address ${child.name} with intimate parental affection ('Ã Â®â€¢Ã Â®Â£Ã Â¯ÂÃ Â®Â£Ã Â®Â¾ ${child.name}', 'Ã Â®Å¡Ã Â¯â€ Ã Â®Â²Ã Â¯ÂÃ Â®Â²Ã Â®Â®Ã Â¯Â', 'Ã Â®Â¤Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â®Ã Â¯Â').`
      : `PROTAGONIST: Do NOT use the child's real name in the story plot. Create lovable storybook characters as heroes, but address the listening child affectionately as 'Ã Â®â€¢Ã Â®Â£Ã Â¯ÂÃ Â®Â£Ã Â®Â¾' or 'Ã Â®Å¡Ã Â¯â€ Ã Â®Â²Ã Â¯ÂÃ Â®Â²Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®Â¿'.`;

    // Strict safety & fear avoidance guardrails (negative constraints)
    let fearAvoidanceInstruction = '';
    const fears = child.fearsToAvoid || [];
    if (fears.length > 0) {
      fearAvoidanceInstruction = `CRITICAL SAFETY RULE (ABSOLUTE PROHIBITION):
Under NO circumstances mention, hint at, or introduce any elements related to: [${fears.join(', ')}].
DO NOT include darkness, monsters, ghosts, scary shadows, loud sudden noises, getting lost, danger, or being separated from parents.
The entire environment must feel 100% safe, loving, cozy, and reassuring.`;
    }

    // Personalization rules
    const personalizationRules: string[] = [];
    if (dto.includeFavoriteThings !== false) {
      if (child.interests && child.interests.length > 0) {
        personalizationRules.push(`Child's beloved interests to weave into the story: ${child.interests.join(', ')}.`);
      }
      if (child.favoriteCharacters && child.favoriteCharacters.length > 0) {
        personalizationRules.push(`Child's favorite character motifs/buddies: ${child.favoriteCharacters.join(', ')}.`);
      }
    }
    if (dto.includeFamilyMembers) {
      const familyMention = parentRelationship === 'Amma' 
        ? 'Amma (Ã Â®â€¦Ã Â®Â®Ã Â¯ÂÃ Â®Â®Ã Â®Â¾) and Appa (Ã Â®â€¦Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¾)' 
        : 'Appa (Ã Â®â€¦Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¾) and Amma (Ã Â®â€¦Ã Â®Â®Ã Â¯ÂÃ Â®Â®Ã Â®Â¾)';
      personalizationRules.push(`Weave in loving references to family (${familyMention}, Thatha, Paati) giving warm hugs, tucking into bed, and keeping the child safe.`);
    }
    if (memorySnippet) {
      personalizationRules.push(`Naturally weave in this cherished real-world family memory: "${memorySnippet}".`);
    }
    if (dto.additionalInstruction) {
      personalizationRules.push(`Parent's special note: "${dto.additionalInstruction}".`);
    }
    if (child.bedtimeHour !== undefined && child.bedtimeHour !== null) {
      const displayHour = child.bedtimeHour % 12 === 0 ? 12 : child.bedtimeHour % 12;
      const displayMinute = String(child.bedtimeMinute || 0).padStart(2, '0');
      const ampm = child.bedtimeHour >= 12 ? 'PM' : 'AM';
      personalizationRules.push(`Child's habitual bedtime: ${displayHour}:${displayMinute} ${ampm}. Gently reassure the child that it's peaceful night time and time to close eyes.`);
    }

    // Calmness & Wind-Down Pacing
    let pacingInstruction = '';
    if (calmness >= 0.7) {
      pacingInstruction = `BEDTIME WIND-DOWN (Deep Sleep Pacing - Calmness: ${calmness}/1.0):
- Start with an enchanting premise, but progressively SLOW DOWN the tempo throughout the second half.
- Use repetitive, rhythmic, lullaby-like spoken Tamil phrases describing heavy eyelids (Ã Â®â€¢Ã Â®Â£Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â Ã Â®Â®Ã Â¯â€ Ã Â®Â¤Ã Â¯ÂÃ Â®ÂµÃ Â®Â¾ Ã Â®Å¡Ã Â¯Å Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®Â¤Ã Â¯Â), deep calm breathing (Ã Â®â€ Ã Â®Â´Ã Â¯ÂÃ Â®Â¨Ã Â¯ÂÃ Â®Â¤ Ã Â®Â®Ã Â¯â€šÃ Â®Å¡Ã Â¯ÂÃ Â®Å¡Ã Â¯Â), cozy warm blankets (Ã Â®â€¢Ã Â®Â¤Ã Â®â€¢Ã Â®Â¤Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¾Ã Â®Â© Ã Â®ÂªÃ Â¯â€¹Ã Â®Â°Ã Â¯ÂÃ Â®ÂµÃ Â¯Ë†), twinkling night stars (Ã Â®Â®Ã Â®Â¿Ã Â®Â©Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®Â®Ã Â¯Â Ã Â®Â¨Ã Â®Â¿Ã Â®Â²Ã Â®Â¾), and sweet peaceful slumber.
- End with a gentle, soothing bedtime blessing: "Ã Â®Â¨Ã Â®Â²Ã Â¯ÂÃ Â®Â²Ã Â®Â¾ Ã Â®Â¤Ã Â¯â€šÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â¯Â Ã Â®â€¢Ã Â®Â£Ã Â¯ÂÃ Â®Â£Ã Â®Â¾... Ã Â®â€¡Ã Â®Â©Ã Â®Â¿Ã Â®Â®Ã Â¯Ë†Ã Â®Â¯Ã Â®Â¾Ã Â®Â© Ã Â®â€¢Ã Â®Â©Ã Â®ÂµÃ Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â¯Â Ã Â®ÂµÃ Â®Â°Ã Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â¯ÂÃ Â®Â®Ã Â¯Â."`;
    } else if (calmness >= 0.4) {
      pacingInstruction = `BEDTIME WIND-DOWN (Balanced Pacing - Calmness: ${calmness}/1.0):
- Balanced, cozy storytelling with gentle adventures that smoothly transition into relaxing bedtime calmness at the end.`;
    } else {
      pacingInstruction = `BEDTIME WIND-DOWN (Playful Adventure - Calmness: ${calmness}/1.0):
- Lively, fun storytelling with spirited events, softly winding down into bedtime cuddles at the very end.`;
    }

    // Dialect & Linguistic Guidance
    const dialectGuideline = `DIALECT & SPOKEN STYLE (${dialect} Spoken Tamil):
- Speak in NATURAL SPOKEN TAMIL (Ã Â®Å½Ã Â®Â³Ã Â®Â¿Ã Â®Â¯ Ã Â®ÂªÃ Â¯â€¡Ã Â®Å¡Ã Â¯ÂÃ Â®Å¡Ã Â¯ÂÃ Â®Â¤Ã Â¯Â Ã Â®Â¤Ã Â®Â®Ã Â®Â¿Ã Â®Â´Ã Â¯Â), exactly how parents talk to kids at home in Tamil Nadu.
- DO NOT use archaic written/literary Tamil (Ã Â®Â¤Ã Â¯â€šÃ Â®Â¯ Ã Â®Å½Ã Â®Â´Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯Â Ã Â®Â¤Ã Â®Â®Ã Â®Â¿Ã Â®Â´Ã Â¯Â) like 'Ã Â®Å¡Ã Â¯â€ Ã Â®Â©Ã Â¯ÂÃ Â®Â±Ã Â®Â¾Ã Â®Â©Ã Â¯Â', 'Ã Â®â€¢Ã Â¯â€šÃ Â®Â±Ã Â®Â¿Ã Â®Â©Ã Â®Â¾Ã Â®Â©Ã Â¯Â', 'Ã Â®â€¦Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®Â³Ã Â¯ÂÃ Â®Â³', 'Ã Â®Â®Ã Â®â€¢Ã Â®Â¿Ã Â®Â´Ã Â¯ÂÃ Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â®Â¾Ã Â®Â©Ã Â¯Â'.
- USE natural colloquial forms: 'Ã Â®ÂªÃ Â¯â€¹Ã Â®Â©Ã Â®Â¾Ã Â®Â©Ã Â¯Â', 'Ã Â®Å¡Ã Â¯Å Ã Â®Â©Ã Â¯ÂÃ Â®Â©Ã Â®Â¾Ã Â®Â©Ã Â¯Â', 'Ã Â®â€¦Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢ Ã Â®â€¡Ã Â®Â°Ã Â¯ÂÃ Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®Â¿Ã Â®Â±', 'Ã Â®Â°Ã Â¯Å Ã Â®Â®Ã Â¯ÂÃ Â®Âª Ã Â®Å¡Ã Â®Â¨Ã Â¯ÂÃ Â®Â¤Ã Â¯â€¹Ã Â®Â·Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â®Â¾Ã Â®Â©Ã Â¯Â', 'Ã Â®ÂªÃ Â®Â¾Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â®Â¿Ã Â®Â¯Ã Â®Â¾', 'Ã Â®â€¦Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®Â±Ã Â®Â®Ã Â¯Â'.
${dialect === 'Chennai' ? '- Incorporate warm Chennai spoken cadence and natural colloquial words.' : ''}
${dialect === 'Kongu' ? '- Incorporate respectful, affectionate Kongu dialect cadence (Ã Â®ÂÃ Â®Â©Ã Â¯ÂÃ Â®â„¢Ã Â¯Â, Ã Â®â€¦Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®Å¸Ã Â®Â¿Ã Â®â„¢Ã Â¯Â, Ã Â®â€¢Ã Â®Â£Ã Â¯ÂÃ Â®Â£Ã Â¯Â).' : ''}
${dialect === 'Madurai' ? '- Incorporate warm, rhythmic Madurai dialect cadence (Ã Â®Å¡Ã Â¯Å Ã Â®Â²Ã Â¯ÂÃ Â®Â²Ã Â¯ÂÃ Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¾, Ã Â®â€¦Ã Â®Â®Ã Â¯ÂÃ Â®ÂªÃ Â¯ÂÃ Â®Å¸Ã Â¯ÂÃ Â®Å¸Ã Â¯ÂÃ Â®Â¤Ã Â®Â¾Ã Â®Â©Ã Â¯Â, Ã Â®ÂªÃ Â®Â¾Ã Â®Â°Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯â‚¬Ã Â®Â¯Ã Â®Â³Ã Â®Â¾).' : ''}
${dialect === 'Tirunelveli' ? '- Incorporate Nellai spoken warmth and cadence (Ã Â®ÂÃ Â®Â²Ã Â¯â€¡, Ã Â®â€¦Ã Â®Å¸Ã Â¯â€¡Ã Â®â„¢Ã Â¯ÂÃ Â®â€¢Ã Â®ÂªÃ Â¯ÂÃ Â®ÂªÃ Â®Â¾).' : ''}`;

    // Full System Instruction
    const systemInstruction = `You are an affectionate Tamil ${parentRelationship} telling an intimate bedtime story to your child.
You speak with absolute parental love, warmth, and tenderness.

CORE RULES:
1. STRICT SPOKEN TAMIL (Ã Â®Å½Ã Â®Â³Ã Â®Â¿Ã Â®Â¯ Ã Â®ÂªÃ Â¯â€¡Ã Â®Å¡Ã Â¯ÂÃ Â®Å¡Ã Â¯ÂÃ Â®Â¤Ã Â¯Â Ã Â®Â¤Ã Â®Â®Ã Â®Â¿Ã Â®Â´Ã Â¯Â):
   Write exclusively in conversational Tamil script (Ã Â®Â¤Ã Â®Â®Ã Â®Â¿Ã Â®Â´Ã Â¯Â Ã Â®Å½Ã Â®Â´Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®â€¢Ã Â®Â³Ã Â®Â¿Ã Â®Â²Ã Â¯Â Ã Â®Å½Ã Â®Â³Ã Â®Â¿Ã Â®Â¯ Ã Â®ÂªÃ Â¯â€¡Ã Â®Å¡Ã Â¯ÂÃ Â®Å¡Ã Â¯Â Ã Â®ÂµÃ Â®Â´Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â¯Â). Never use archaic literary Tamil (Ã Â®Å½Ã Â®Â´Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯Â Ã Â®Â¤Ã Â®Â®Ã Â®Â¿Ã Â®Â´Ã Â¯Â).
2. ${dialectGuideline}
3. ${ageGuidelines}
4. ${protagonistInstruction}
${fearAvoidanceInstruction ? `5. ${fearAvoidanceInstruction}\n` : ''}
6. STORY LENGTH & WORD COUNT:
   The story MUST be between ${minWords} and ${maxWords} Tamil words (target: ~${targetWords} words) to match a ${targetDurationMinutes}-minute spoken narration. DO NOT make it too short or abruptly cut it off.
7. ${pacingInstruction}`;

    // Prompt Idea with full governance details
    const promptDetails: string[] = [
      `Story Premise: "${dto.promptIdea || `A heartwarming bedtime story for ${child.name}`}"`,
      `Story Theme / Genre: ${storyTheme}`,
      `Emotional Mood: ${storyMood}`,
      `Target Narration Length: ${targetDurationMinutes} minutes (~${targetWords} Tamil spoken words)`,
    ];

    if (dto.moralLesson) {
      promptDetails.push(`Gentle Positive Value / Moral: ${dto.moralLesson}`);
    }
    if (personalizationRules.length > 0) {
      promptDetails.push(`Personalization Details:\n${personalizationRules.map(r => `  - ${r}`).join('\n')}`);
    }

    const fullPrompt = `Please create a complete, heartwarming bedtime story in natural spoken Tamil following these specifications:

${promptDetails.join('\n')}

Begin the story directly with a warm parental opening like "Ã Â®â€¢Ã Â®Â£Ã Â¯ÂÃ Â®Â£Ã Â®Â¾...", without any title prefixes, Markdown headers, or meta-commentary. Write the entire story in continuous, immersive spoken Tamil paragraphs.`;

    const storyTitle = dto.promptIdea && dto.promptIdea.length <= 40
      ? dto.promptIdea
      : `${child.name}-Ã Â®â€¡Ã Â®Â©Ã Â¯Â Ã Â®Â¨Ã Â®Â¿Ã Â®Â²Ã Â®Â¾ Ã Â®â€¢Ã Â®Â¤Ã Â¯Ë†`;

    const story: IStorySchema = {
      storyId,
      userId,
      childId: dto.childId,
      voiceId: dto.voiceId,
      title: storyTitle,
      theme: storyTheme,
      mood: storyMood,
      bedtimeCalmness: calmness,
      promptIdea: dto.promptIdea,
      targetDurationMinutes,
      moralLesson: dto.moralLesson,
      includedMemoryIds: dto.includeMemoryIds || [],
      language: 'ta',
      dialect,
      status: 'QUEUED',
      progressPercent: 5,
      stageMessage: 'Initiating bedtime story creation...',
      isFavorite: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await storyDao.createStory(story);
    logger.info(`Ã¢Å“â€¦ [StoryService] Created initial story record storyId=${storyId}`);

    // Dynamic speaking rate & token budget
    const dynamicSpeakingRate = dto.speakingRate || (calmness >= 0.7 ? 0.85 : calmness >= 0.4 ? 0.90 : 0.95);
    const dynamicMaxTokens = dto.maxTokens || Math.max(1600, targetDurationMinutes * 380);

    // In AWS Lambda, background tasks (setImmediate/setInterval) freeze as soon as the HTTP response returns.
    // Execute the AI pipeline synchronously within the active request context:
    try {
      await storyDao.updateStoryStatus(storyId, 'GENERATING_SCRIPT', 25, 'Writing story in natural spoken Tamil...');

      logger.info(`Ã°Å¸Å¡â‚¬ [StoryService] Submitting story pipeline to AI service for storyId=${storyId}`);
      const job = await aiServiceClient.submitStoryPipeline({
        storyId,
        childName: child.name,
        promptIdea: fullPrompt,
        systemInstruction,
        dialect,
        memorySnippet,
        aiVoiceId,
        voiceId: dto.voiceId,
        model: dto.model,
        llmProvider: dto.llmProvider,
        ttsProvider: resolvedTtsProvider,
        provider: resolvedTtsProvider,
        voiceProvider: resolvedTtsProvider,
        speaker: resolvedSpeaker,
        speakingRate: dynamicSpeakingRate,
        maxTokens: dynamicMaxTokens,
        targetDurationMinutes,
        emotion: storyMood,
        mood: storyMood,
        bedtimeCalmness: calmness,
      });

      logger.info(`Ã°Å¸Å½â€° [StoryService] AI job returned: jobId=${job.jobId}, status=${job.status}`);

      if (job.status === 'COMPLETED' && job.result) {
        logger.info(`Ã°Å¸Å½â€° [StoryService] AI job completed for storyId=${storyId}! Audio: ${job.result.audioUrl}`);
        await storyDao.completeStory(storyId, {
          storyScript: job.result.storyScript,
          audioUrl: job.result.audioUrl,
          audioS3Key: job.result.audioS3Key,
          audioDurationSeconds: job.result.durationSeconds || targetDurationMinutes * 60,
          coverImageUrl: 'https://cdn.nila.app/covers/default_moon.png',
        });
        const completedStory = await storyDao.getStory(storyId);
        return completedStory || {
          ...story,
          status: 'READY',
          progressPercent: 100,
          storyScript: job.result.storyScript,
          audioUrl: job.result.audioUrl,
          audioS3Key: job.result.audioS3Key,
          audioDurationSeconds: job.result.durationSeconds || targetDurationMinutes * 60,
        };
      } else if (job.status === 'FAILED') {
        logger.error(`Ã¢ÂÅ’ [StoryService] AI job failed for storyId=${storyId}: ${job.errorMessage}`);
        await storyDao.updateStoryStatus(storyId, 'FAILED', 0, job.errorMessage || 'Generation failed');
        throw new ApiError(`AI generation failed: ${job.errorMessage}`);
      } else {
        return story;
      }
    } catch (err: any) {
      logger.error(`Ã°Å¸â€™Â¥ [StoryService] Failed to generate story ${storyId}: ${err.message}`, { stack: err.stack });
      await storyDao.updateStoryStatus(storyId, 'FAILED', 0, err.message);
      throw err;
    }
  }

  async getStoryStatus(storyId: string) {
    const story = await storyDao.getStory(storyId);
    if (!story) {
      throw new NotFoundError(`Story ${storyId} not found`);
    }
    return {
      storyId: story.storyId,
      status: story.status,
      progressPercent: story.progressPercent,
      stageMessage: story.stageMessage,
      audioUrl: story.audioUrl,
    };
  }

  async getStory(storyId: string): Promise<IStorySchema> {
    const story = await storyDao.getStory(storyId);
    if (!story) {
      throw new NotFoundError(`Story ${storyId} not found`);
    }
    return story;
  }

  async getStories(userId: string, childId?: string): Promise<IStorySchema[]> {
    if (childId) {
      return await storyDao.getStoriesByChildId(childId);
    }
    return await storyDao.getStoriesByUserId(userId);
  }

  async toggleFavorite(storyId: string, isFavorite: boolean): Promise<void> {
    await storyDao.toggleFavorite(storyId, isFavorite);
  }
}

export default new StoryService();
