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

export function normalizeRelationship(rel?: string): string {
  if (!rel) return 'Appa';
  const lower = rel.trim().toLowerCase();
  if (lower === 'mother' || lower === 'mom' || lower === 'amma') return 'Amma';
  if (lower === 'father' || lower === 'dad' || lower === 'appa') return 'Appa';
  if (lower === 'grandmother' || lower === 'paati' || lower === 'patti') return 'Paati';
  if (lower === 'grandfather' || lower === 'thatha' || lower === 'tata') return 'Thatha';
  if (lower === 'other' || lower === 'guardian') return 'Other';
  return rel.trim();
}

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

    let aiVoiceId: string | undefined;
    let resolvedTtsProvider = dto.ttsProvider || dto.voiceProvider || dto.provider;
    let resolvedSpeaker = dto.speaker || dto.voiceName;
    let voiceProfileRel: string | undefined;

    logger.info(`🎤 [StoryService] Initial story request voice config: voiceId="${dto.voiceId || 'none'}", provider="${resolvedTtsProvider || 'none'}", speaker="${resolvedSpeaker || 'none'}"`);

    if (dto.voiceId) {
      // Fetch voice profile directly from DynamoDB without restrictive provider filter
      const voice = await voiceProfileDao.getVoice(dto.voiceId);
      if (voice) {
        if (voice.relationship) {
          voiceProfileRel = voice.relationship;
        }
        if (voice.aiServiceVoiceId) {
          aiVoiceId = voice.aiServiceVoiceId;
        }
        // Couple voiceId with its registered provider (sarvam or elevenlabs)
        if (voice.provider || voice.voiceProvider) {
          resolvedTtsProvider = ((voice.provider || voice.voiceProvider) as string).toLowerCase();
        }
        if (!resolvedSpeaker && (voice.providerVoiceId || voice.aiServiceVoiceId)) {
          resolvedSpeaker = voice.providerVoiceId || voice.aiServiceVoiceId;
        }
        logger.info(`🎤 [StoryService] Successfully coupled voiceId="${dto.voiceId}" with registered provider="${resolvedTtsProvider}", aiVoiceId="${aiVoiceId || 'none'}", speaker="${resolvedSpeaker || 'none'}", rel="${voiceProfileRel || 'none'}"`);
      } else {
        logger.warn(`⚠️ [StoryService] Voice profile "${dto.voiceId}" not found in DAO; proceeding with provider="${resolvedTtsProvider || 'sarvam'}"`);
      }
    }

    resolvedTtsProvider = (resolvedTtsProvider || 'sarvam').toLowerCase();

    const parentRelationship = normalizeRelationship(dto.relationship || voiceProfileRel || user?.relationship || 'Appa');

    // Collect included memories - only valid, existing memories from DynamoDB
    let realMemoryIds: string[] = [];
    let memorySnippet = '';
    let targetMemories: Array<{ memoryId: string; title: string; description: string; wovenStoryCount?: number }> = [];

    if (dto.includeMemoryIds && dto.includeMemoryIds.length > 0) {
      const memories = await Promise.all(
        dto.includeMemoryIds.map(id => memoryDao.getMemory(id))
      );
      targetMemories = memories.filter((m): m is NonNullable<typeof m> => !!m);
    } else if (dto.includeLifeMemories) {
      const existing = await memoryDao.getMemoriesByChildId(dto.childId);
      if (existing.length > 0) {
        targetMemories = [existing[0]];
      } else {
        const userMemories = await memoryDao.getMemoriesByUserId(userId);
        if (userMemories.length > 0) {
          targetMemories = [userMemories[0]];
        }
      }
    }

    if (targetMemories.length > 0) {
      realMemoryIds = targetMemories.map(m => m.memoryId);
      memorySnippet = targetMemories
        .map(m => `${m.title}: ${m.description}`)
        .join('. ');

      // Increment wovenStoryCount asynchronously
      Promise.all(
        targetMemories.map(m =>
          memoryDao.updateMemory(m.memoryId, {
            wovenStoryCount: (m.wovenStoryCount || 0) + 1,
          })
        )
      ).catch(err => logger.warn(`[StoryService] Failed to increment wovenStoryCount: ${err}`));
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

    // Strict Colloquial Tamil & Slang Guidance (Zero Thuya Tamil)
    const colloquialSpokenRules = `STRICT COLLOQUIAL SPOKEN TAMIL (இயல்பான பேச்சுத் தமிழ் மட்டுமே - புத்தகத் தமிழ் அறவே கூடாது):
- The narration MUST sound 100% like a loving Tamil parent speaking naturally at bedtime, NOT reading from a printed storybook.
- STRICTLY FORBIDDEN WORDS (தூய / புத்தகத் தமிழ் தடை) & MANDATORY SPOKEN REPLACEMENTS:
  * ❌ NEVER USE "கூறினார்" / "கூறினான்" / "கூறியது" / "கூறினார்கள்" / "என்றார்" -> ALWAYS USE "சொன்னான்" / "சொன்னாரு" / "சொல்லிச்சு" / "சொன்னாங்க" / "கேட்டுச்சு"
  * ❌ NEVER USE "சென்றான்" / "சென்றது" / "சென்றார்கள்" / "சென்றன" -> ALWAYS USE "போனான்" / "போச்சு" / "போனாங்க" / "கிளம்பிச்சு"
  * ❌ NEVER USE "உண்டான்" / "உண்டது" / "அருந்தினான்" -> ALWAYS USE "சாப்பிட்டான்" / "சாப்பிட்டுச்சு" / "குடிச்சான்"
  * ❌ NEVER USE "கண்டான்" / "கண்டது" -> ALWAYS USE "பார்த்தான்" / "பார்த்துச்சு" / "பாத்துச்சு"
  * ❌ NEVER USE "மகிழ்ந்தான்" / "மகிழ்ச்சியடைந்தார்" -> ALWAYS USE "ரொம்ப சந்தோஷப்பட்டான்" / "குஷி ஆயிட்டான்" / "ரொம்ப குஷியா இருந்துச்சு"
  * ❌ NEVER USE "அங்குள்ள" / "இங்குள்ள" / "எங்குள்ள" -> ALWAYS USE "அங்க இருக்கிற" / "இங்க இருக்கிற" / "எங்க இருக்கிற"
  * ❌ NEVER USE "செய்தான்" / "செய்தது" / "செய்தார்கள்" -> ALWAYS USE "பண்ணினான்" / "செஞ்சான்" / "பண்ணுச்சு" / "செஞ்சாங்க"
  * ❌ NEVER USE "அப்பொழுது" / "இப்பொழுது" / "எப்பொழுது" -> ALWAYS USE "அப்போ" / "இப்போ" / "எப்போ"
  * ❌ NEVER USE "அதனால்" / "எனவே" / "ஆகையால்" -> ALWAYS USE "அதனால" / "அதனாலதான்"
  * ❌ NEVER USE "ஓடியது" / "பறந்தது" / "நின்றது" -> ALWAYS USE "ஓடுச்சு" / "பறந்துச்சு" / "நின்னுச்சு"
  * ❌ NEVER USE "வந்தது" / "இருந்தது" / "ஆனது" -> ALWAYS USE "வந்துச்சு" / "இருந்துச்சு" / "ஆச்சு"
  * ❌ NEVER USE "அவனுடைய" / "அவளுடைய" / "அவர்களுடைய" -> ALWAYS USE "அவனோட" / "அவளோட" / "அவங்களோட"
  * ❌ NEVER USE "வீட்டிற்கு" / "காட்டிற்கு" / "நாட்டிற்கு" -> ALWAYS USE "வீட்டுக்கு" / "காட்டுக்கு" / "நாட்டுக்கு"
  * ❌ NEVER USE "பெரியதொரு" / "சிறியதொரு" -> ALWAYS USE "ஒரு பெரிய" / "ஒரு சின்ன"
  * ❌ NEVER USE "விழுந்தது" / "கேட்டது" -> ALWAYS USE "விழுந்துச்சு" / "கேட்டுச்சு"

- ORAL STORYTELLING CADENCE & PARENTAL HOOKS:
  * Weave in natural intimate rhetorical questions and pauses:
    "தெரியுமா கண்ணா?", "அப்புறம் என்னாச்சு தெரியுமா?", "அடடா!", "ஆஹா!", "பாருடா செல்லம்", "அங்க என்ன நடந்துச்சு தெரியுமா?", "அப்புறம் மெதுவா..."
  * Real conversational cadence: Keep it cozy, tender, and deeply affectionate.`;

    // Dialect Slang Guidance
    let dialectSlangGuideline = '';
    if (dialect === 'Chennai') {
      dialectSlangGuideline = `REGIONAL SLANG (${dialect} Spoken Tamil):
- Use everyday warm Chennai colloquial terms and friendly street rhythm: "சூப்பரா", "செம ஜாலியா", "கலக்கிட்டான்", "பாத்துக்கோ", "அப்புறம் என்னாச்சு தெரியுமா?", "நம்ம குட்டி", "அடேங்கப்பா".`;
    } else if (dialect === 'Kongu') {
      dialectSlangGuideline = `REGIONAL SLANG (${dialect} Spoken Tamil):
- Use tender Kongu speech cadence and affectionate markers: "ஏனுங்", "கண்ணு", "அப்புடிங்", "பண்ணுச்சுங்க", "தங்கமே", "சமத்தா", "இருந்துதுங்க".`;
    } else if (dialect === 'Madurai') {
      dialectSlangGuideline = `REGIONAL SLANG (${dialect} Spoken Tamil):
- Use hearty Madurai colloquial phrasing: "சொல்லுங்கப்பா", "அம்புட்டுதான்", "பார்த்தீயளா", "ஜம்முன்னு", "பொசுக்குன்னு", "கண்ணு", "ராசா".`;
    } else if (dialect === 'Tirunelveli') {
      dialectSlangGuideline = `REGIONAL SLANG (${dialect} Spoken Tamil):
- Use authentic Nellai cadence: "ஏலே", "அடேங்கப்பா", "மக்களே", "செல்லக்குட்டி", "அசந்து போச்சு", "அப்படியே".`;
    } else {
      dialectSlangGuideline = `REGIONAL SLANG (Natural Spoken Tamil):
- Warm colloquial spoken rhythm with conversational Tamil expressions.`;
    }

    // Story Logic, Meaning, Quality & Non-rambling Guardrail
    const storyQualityAndLogicGuideline = `STORY QUALITY, LOGIC, MEANING & MORAL (NO BLABBER / NO RAMBLING):
1. STRICTLY NO BLABBER OR NONSENSICAL RAMBLING:
   - Do NOT produce repetitive filler, disconnected sentences, aimless wandering, or circular loops.
   - Every sentence must carry purpose, warmth, and advance the narrative smoothly.
2. COMPELLING NARRATIVE LOGIC & CAUSE-AND-EFFECT:
   - The plot must make logical sense to a child. Actions must have clear reasons and believable consequences.
   - Characters must have relatable motivations, face a gentle, intriguing dilemma or curiosity, and resolve it using wit, kindness, patience, sharing, or teamwork—NOT random unexplained magic or nonsensical plot jumps.
3. MEANINGFUL MORAL & EMOTIONAL DEPTH:
   - The story MUST carry a genuine, heartwarming life lesson / moral (${dto.moralLesson || 'kindness, empathy, patience, or sharing'}).
   - The moral must NOT feel like a dry lecture or robotic conclusion; it must flow organically from how the characters solved their dilemma and treated each other.`;

    // Full System Instruction
    const systemInstruction = `You are an affectionate Tamil ${parentRelationship} telling an intimate bedtime story to your child.
You speak with absolute parental love, warmth, and tenderness sitting right by the bed.

CORE RULES:
1. ${colloquialSpokenRules}
2. ${dialectSlangGuideline}
3. ${storyQualityAndLogicGuideline}
4. ${ageGuidelines}
5. ${protagonistInstruction}
${fearAvoidanceInstruction ? `6. ${fearAvoidanceInstruction}\n` : ''}
7. STORY LENGTH & WORD COUNT:
   The story MUST be between ${minWords} and ${maxWords} Tamil words (target: ~${targetWords} words) to match a ${targetDurationMinutes}-minute spoken narration. DO NOT make it too short or abruptly cut it off.
8. ${pacingInstruction}`;

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

STORYTELLING EXECUTION GUIDELINES:
1. Realistic Voice & Slang: Tell this story out loud as a loving ${parentRelationship}. Use pure everyday conversational spoken Tamil with natural dialogue particles ("தெரியுமா கண்ணா?", "அப்புறம் என்னாச்சு தெரியுமா?", "அடடா!"). Zero Thuya Tamil (absolutely no "கூறினார்", "சென்றான்", "உண்டான்").
2. Quality & Logic: Build a coherent, meaningful story with a clear, logical beginning, gentle problem/curiosity, clever/kind resolution, and an authentic moral lesson. Absolutely no rambling, blabbering, or repetitive filler.
3. Format: Begin the story directly with a warm parental opening like "கண்ணா...", without any title prefixes, Markdown headers, or meta-commentary. Write the entire story in continuous, immersive spoken Tamil paragraphs that smoothly wind down into cozy bedtime sleep.`;

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
      includedMemoryIds: realMemoryIds,
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

    // In AWS Lambda, background tasks (setImmediate/setInterval) freeze as soon as the HTTP response returns.
    // Execute the AI pipeline synchronously within the active request context:
    try {
      await storyDao.updateStoryStatus(storyId, 'GENERATING_SCRIPT', 25, 'Writing story in natural spoken Tamil...');

      logger.info(`🚀 [StoryService] Submitting story pipeline to AI service for storyId=${storyId} (ttsProvider="${resolvedTtsProvider}", speaker="${resolvedSpeaker || 'default'}", voiceId="${dto.voiceId || 'none'}")`);
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

      logger.info(`🎉 [StoryService] AI job returned: jobId=${job.jobId}, status=${job.status}`);

      if (job.status === 'COMPLETED' && job.result) {
        logger.info(`🎉 [StoryService] AI job completed for storyId=${storyId}! Audio: ${job.result.audioUrl}`);
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
        logger.error(`❌ [StoryService] AI job failed for storyId=${storyId}: ${job.errorMessage}`);
        await storyDao.updateStoryStatus(storyId, 'FAILED', 0, job.errorMessage || 'Generation failed');
        throw new ApiError(`AI generation failed: ${job.errorMessage}`);
      } else {
        return story;
      }
    } catch (err: any) {
      logger.error(`💥 [StoryService] Failed to generate story ${storyId}: ${err.message}`, { stack: err.stack });
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
