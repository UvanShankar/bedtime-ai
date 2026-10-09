import storyDao from '../dao/StoryDao';
import childDao from '../dao/ChildDao';
import userDao from '../dao/UserDao';
import memoryDao from '../dao/MemoryDao';
import voiceProfileDao from '../dao/VoiceProfileDao';
import aiServiceClient from './AIServiceClient';
import { IStorySchema } from '../models/Story';
import { IRequestStoryDTO } from '../types';
import { generateId } from '../utils';
import { NotFoundError, ValidationError } from '../exceptions/ApiError';
import logger from '../logger';

export class StoryService {
  async requestStory(userId: string, dto: IRequestStoryDTO): Promise<IStorySchema> {
    logger.info(`📖 [StoryService] Requesting story generation for user=${userId}, childId=${dto.childId}`, {
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
    let resolvedTtsProvider = dto.ttsProvider || dto.voiceProvider || dto.provider;
    let resolvedSpeaker = dto.speaker || dto.voiceName;

    if (dto.voiceId) {
      const voice = await voiceProfileDao.getVoice(dto.voiceId, resolvedTtsProvider);
      if (voice) {
        if (voice.aiServiceVoiceId) {
          aiVoiceId = voice.aiServiceVoiceId;
        }
        // Couple voiceId with its registered provider
        if (voice.provider || voice.voiceProvider) {
          resolvedTtsProvider = voice.provider || voice.voiceProvider;
        }
        if (!resolvedSpeaker && (voice.providerVoiceId || voice.aiServiceVoiceId)) {
          resolvedSpeaker = voice.providerVoiceId || voice.aiServiceVoiceId;
        }
        logger.debug(`🎤 [StoryService] Coupled voiceId="${dto.voiceId}" with provider="${resolvedTtsProvider}", aiVoiceId="${aiVoiceId || 'none'}"`);
      } else {
        logger.warn(`⚠️ [StoryService] Voice profile "${dto.voiceId}" not found in DAO; proceeding with default voice`);
      }
    }

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
- Use soft sounds and warm sensory descriptions (மெதுவா, பளபளன்னு, பஞ்சு போல, வெதுவெதுப்பா).
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
      ? `PROTAGONIST: The hero is ${child.name}. Address ${child.name} with intimate parental affection ('கண்ணா ${child.name}', 'செல்லம்', 'தங்கம்').`
      : `PROTAGONIST: Do NOT use the child's real name in the story plot. Create lovable storybook characters as heroes, but address the listening child affectionately as 'கண்ணா' or 'செல்லக்குட்டி'.`;

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
        ? 'Amma (அம்மா) and Appa (அப்பா)' 
        : 'Appa (அப்பா) and Amma (அம்மா)';
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
- Use repetitive, rhythmic, lullaby-like spoken Tamil phrases describing heavy eyelids (கண்கள் மெதுவா சொக்குது), deep calm breathing (ஆழ்ந்த மூச்சு), cozy warm blankets (கதகதப்பான போர்வை), twinkling night stars (மினுக்கும் நிலா), and sweet peaceful slumber.
- End with a gentle, soothing bedtime blessing: "நல்லா தூங்கு கண்ணா... இனிமையான கனவுகள் வரட்டும்."`;
    } else if (calmness >= 0.4) {
      pacingInstruction = `BEDTIME WIND-DOWN (Balanced Pacing - Calmness: ${calmness}/1.0):
- Balanced, cozy storytelling with gentle adventures that smoothly transition into relaxing bedtime calmness at the end.`;
    } else {
      pacingInstruction = `BEDTIME WIND-DOWN (Playful Adventure - Calmness: ${calmness}/1.0):
- Lively, fun storytelling with spirited events, softly winding down into bedtime cuddles at the very end.`;
    }

    // Dialect & Linguistic Guidance
    const dialectGuideline = `DIALECT & SPOKEN STYLE (${dialect} Spoken Tamil):
- Speak in NATURAL SPOKEN TAMIL (எளிய பேச்சுத் தமிழ்), exactly how parents talk to kids at home in Tamil Nadu.
- DO NOT use archaic written/literary Tamil (தூய எழுத்துத் தமிழ்) like 'சென்றான்', 'கூறினான்', 'அங்குள்ள', 'மகிழ்ந்தான்'.
- USE natural colloquial forms: 'போனான்', 'சொன்னான்', 'அங்க இருக்கிற', 'ரொம்ப சந்தோஷப்பட்டான்', 'பாத்தியா', 'அப்புறம்'.
${dialect === 'Chennai' ? '- Incorporate warm Chennai spoken cadence and natural colloquial words.' : ''}
${dialect === 'Kongu' ? '- Incorporate respectful, affectionate Kongu dialect cadence (ஏனுங், அப்புடிங், கண்ணு).' : ''}
${dialect === 'Madurai' ? '- Incorporate warm, rhythmic Madurai dialect cadence (சொல்லுங்கப்பா, அம்புட்டுதான், பார்த்தீயளா).' : ''}
${dialect === 'Tirunelveli' ? '- Incorporate Nellai spoken warmth and cadence (ஏலே, அடேங்கப்பா).' : ''}`;

    // Full System Instruction
    const systemInstruction = `You are an affectionate Tamil ${parentRelationship} telling an intimate bedtime story to your child.
You speak with absolute parental love, warmth, and tenderness.

CORE RULES:
1. STRICT SPOKEN TAMIL (எளிய பேச்சுத் தமிழ்):
   Write exclusively in conversational Tamil script (தமிழ் எழுத்துகளில் எளிய பேச்சு வழக்கு). Never use archaic literary Tamil (எழுத்துத் தமிழ்).
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

Begin the story directly with a warm parental opening like "கண்ணா...", without any title prefixes, Markdown headers, or meta-commentary. Write the entire story in continuous, immersive spoken Tamil paragraphs.`;

    const storyTitle = dto.promptIdea && dto.promptIdea.length <= 40
      ? dto.promptIdea
      : `${child.name}-இன் நிலா கதை`;

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
    logger.info(`✅ [StoryService] Created initial story record storyId=${storyId}`);

    // Dynamic speaking rate & token budget
    const dynamicSpeakingRate = dto.speakingRate || (calmness >= 0.7 ? 0.85 : calmness >= 0.4 ? 0.90 : 0.95);
    const dynamicMaxTokens = dto.maxTokens || Math.max(1600, targetDurationMinutes * 380);

    // Asynchronously trigger AI Service pipeline
    setImmediate(async () => {
      try {
        await storyDao.updateStoryStatus(storyId, 'GENERATING_SCRIPT', 25, 'Writing story in natural spoken Tamil...');

        logger.info(`🚀 [StoryService] Submitting story pipeline to AI service for storyId=${storyId}`);
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

        logger.info(`⏳ [StoryService] AI job dispatched: jobId=${job.jobId} for storyId=${storyId}`);

        // Poll job until ready (20 minutes = 1200s -> 400 attempts at 3-second intervals)
        const pollIntervalMs = Number(process.env.STORY_POLL_INTERVAL_MS) || 3000;
        const maxAttempts = Number(process.env.STORY_MAX_POLL_ATTEMPTS) || 400; // 400 * 3s = 1200s (20 mins)
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await aiServiceClient.getJobStatus(job.jobId);
            logger.debug(`🔄 [StoryService] Polling jobId=${job.jobId} attempt=${attempts}/${maxAttempts}: status=${statusRes.status}, progress=${statusRes.progressPercent}%`);

            if (statusRes.status === 'COMPLETED' && statusRes.result) {
              clearInterval(interval);
              logger.info(`🎉 [StoryService] AI job completed for storyId=${storyId}! Audio: ${statusRes.result.audioUrl}`);
              await storyDao.completeStory(storyId, {
                storyScript: statusRes.result.storyScript,
                audioUrl: statusRes.result.audioUrl,
                audioS3Key: statusRes.result.audioS3Key,
                audioDurationSeconds: statusRes.result.durationSeconds || targetDurationMinutes * 60,
                coverImageUrl: 'https://cdn.nila.app/covers/default_moon.png',
              });
            } else if (statusRes.status === 'FAILED') {
              clearInterval(interval);
              logger.error(`❌ [StoryService] AI job failed for storyId=${storyId}: ${statusRes.errorMessage}`);
              await storyDao.updateStoryStatus(storyId, 'FAILED', 0, statusRes.errorMessage || 'Generation failed');
            } else {
              await storyDao.updateStoryStatus(
                storyId,
                statusRes.progressPercent > 50 ? 'SYNTHESIZING_VOICE' : 'GENERATING_SCRIPT',
                statusRes.progressPercent
              );
            }
          } catch (pollErr: any) {
            logger.error(`⚠️ [StoryService] Poll error for jobId=${job.jobId}: ${pollErr.message}`);
          }

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            const timeoutMinutes = Math.round((maxAttempts * pollIntervalMs) / 60000);
            logger.error(`⏰ [StoryService] Story generation timed out after ${timeoutMinutes} minutes for storyId=${storyId}`);
            await storyDao.updateStoryStatus(storyId, 'FAILED', 0, `Story generation timed out after ${timeoutMinutes} minutes`);
          }
        }, pollIntervalMs);
      } catch (err: any) {
        logger.error(`💥 [StoryService] Failed to generate story ${storyId}: ${err.message}`, { stack: err.stack });
        await storyDao.updateStoryStatus(storyId, 'FAILED', 0, err.message);
      }
    });

    return story;
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
