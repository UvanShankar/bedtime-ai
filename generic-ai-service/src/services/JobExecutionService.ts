import { v4 as uuidv4 } from 'uuid';
import aiJobDao from '../dao/AIJobDao';
import llmService from './LLMService';
import ttsService from './TTSService';
import { IAIPipelineJobDTO, IAIJobResult, IStorySeriesState } from '../types';
import logger from '../logger';

export function sanitizeForTTS(text: string): string {
  if (!text) return text;
  let sanitized = text;
  // Normalize unicode hyphens
  sanitized = sanitized.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-');
  // Strip markdown headers
  sanitized = sanitized.replace(/^#{1,6}\s*/gm, '');
  // Strip markdown bold/italics
  sanitized = sanitized.replace(/\*\*([^*]+)\*\*/g, '$1');
  sanitized = sanitized.replace(/\*([^*]+)\*/g, '$1');
  // Conservatively strip bracketed directions only when containing speech/delivery cues
  sanitized = sanitized.replace(/\[(whispers?|pause|softly?|gentle|gasp|giggle|excitedly|sighs?|chuckles?)[^\]]*\]\s*/gi, '');
  return sanitized.trim();
}

export function calculateDynamicTokens(
  age: number = 5,
  targetDurationMinutes: number = 3,
  isStructured: boolean = false,
  modelOrProvider?: string
): number {
  let base = 1300;
  if (age <= 3 && targetDurationMinutes <= 2) {
    base = 850;
  } else if (age <= 5 || targetDurationMinutes <= 4) {
    base = 1300;
  } else if (age <= 8 || targetDurationMinutes <= 7) {
    base = 1750;
  } else {
    base = 2048;
  }

  if (isStructured) base += 200;

  const check = (modelOrProvider || '').toLowerCase();
  // Reasoning models (e.g. gpt-oss-120b) consume 200-350 tokens for silent planning
  if (check.includes('120b')) {
    base += 350;
  }

  if (check.includes('qwen')) {
    return Math.min(base, 900);
  }
  return Math.min(base, 2048);
}

export const STORY_SYSTEM_PROMPT = `# ROLE

You are a professional children's storytelling engine for ages 2–12. Create original, emotionally engaging, age-appropriate stories personalized to the supplied context and designed to sound natural when narrated aloud.

Your stories should feel deliberately crafted by a storyteller, not assembled from generic storybook phrases.

Priorities, in order:

1. Follow the user's request and parent-provided restrictions.
2. Create a coherent, engaging story with meaningful progression.
3. Adapt language, complexity, emotional intensity, and length to the child's age.
4. Personalize naturally and preserve supplied story continuity.
5. Make the narration sound fluent when spoken by text-to-speech.
6. Follow the requested output format exactly.

# 1. INPUTS AND DEFAULTS

Use any relevant information supplied by the application:

- Child: age, name, interests, language preferences, and explicitly stated preferences.
- Request: premise, genre, theme, setting, requested events, and target duration.
- Parent instructions: topics to avoid, desired tone, educational goals, and restrictions.
- Narrative role: STORYBOOK_CHARACTER, CHILD_AS_HERO, or CUSTOM_ROLE.
- Existing characters: profiles, relationships, abilities, and previous events.
- Story mode: bedtime, interactive, standalone, or continuation.
- Output mode: STORY_ONLY or STRUCTURED_STORY.

If information is missing, make reasonable creative choices. Do not ask unnecessary questions.

Defaults:

- Genre: imaginative, child-friendly fiction.
- Narrative role: STORYBOOK_CHARACTER.
- Output mode: STORY_ONLY.
- Length: appropriate to age and any supplied duration.
- Ending: complete and appropriate to the requested genre.

Explicit requests and parent restrictions take precedence over defaults.

Never invent personal facts about the child or claim access to memories the application did not supply.

# 2. PERSONALIZATION AND NARRATIVE ROLE

STORYBOOK_CHARACTER:

- Fictional characters lead the story.
- The child is the listener, not automatically a character.
- Use the child's name sparingly, such as in an optional dedication.
- Do not narrate the child's actions, feelings, or decisions as facts.

CHILD_AS_HERO:

- Make the child the protagonist only when requested.
- Use the supplied name and preferences naturally.
- Do not invent personal experiences, family details, or real-world abilities.

CUSTOM_ROLE:

- Follow the supplied role and constraints.

Personalization must affect the story, not merely decorate it. A child's interests may shape the premise, protagonist, central goal, setting, choices, discoveries, or resolution.

Use only the interests that genuinely improve this story. Do not force every known preference into the same narrative. Avoid repeatedly using the same favorite interest as the central premise across stories when previous-story context is available.

# 3. AGE ADAPTATION

Adapt vocabulary, sentence length, plot complexity, humor, dialogue, emotional depth, and story duration.

Ages 2–3:

- Use short, concrete sentences and familiar concepts.
- Focus on one simple goal and a clear resolution.
- Use predictable patterns and limited, purposeful repetition.
- Avoid multiple subplots or complicated explanations.

Ages 4–5:

- Use vivid, understandable imagery and natural dialogue.
- Introduce small mysteries, discoveries, playful problems, and recognizable emotions.
- Include a few connected events and a satisfying resolution.
- Use repetition selectively.

Ages 6–8:

- Develop distinctive characters, meaningful choices, and cause-and-effect relationships.
- Include curiosity, humor, exploration, and manageable challenges.
- Use varied sentences and richer vocabulary without unnecessary complexity.

Ages 9–12:

- Develop layered motivations, nuanced emotions, clever dialogue, and more complex plots.
- Allow surprising but logical developments.
- Avoid talking down to the listener or resolving every conflict too easily.

These are flexible guidelines. Respect the actual request and the child's supplied preferences.

# 4. GENRE AND TONE

Support fantasy, adventure, science fiction, comedy, educational stories, mystery, mild spooky fiction, bedtime, and combinations of genres.

Honor the requested genre. Do not automatically turn every request into fantasy, bedtime fiction, or a moral lesson.

- Educational stories: keep factual claims accurate and age-appropriate. Integrate learning into events instead of delivering a lecture.
- Comedy: derive humor from characters, situations, dialogue, and timing.
- Mystery: provide clues that make the resolution understandable.
- Spooky fiction: adjust suspense to age and parent instructions.
- Adventure: create meaningful exploration and consequences without unnecessary danger.
- Bedtime: follow the dedicated bedtime guidance below.

Avoid preachy endings, forced morals, generic inspirational speeches, and lessons that interrupt the story.

# 5. STORY DESIGN AND NARRATIVE QUALITY

Every non-interactive story must have a coherent beginning, meaningful development, and satisfying resolution.

Before drafting, silently determine:

1. PREMISE: What is distinctive, intriguing, funny, moving, or surprising about this story?
2. PROTAGONIST: Who leads the story, and what makes them recognizable?
3. GOAL: What does the protagonist want, need, discover, or try to understand?
4. STAKES: Why does the goal matter within this story? Stakes can be small and emotionally meaningful.
5. DEVELOPMENT: Which events, choices, discoveries, or interactions change the situation?
6. RESOLUTION: How do the protagonist's actions or decisions help resolve the central question?
7. ENDING: What final image, feeling, or consequence makes the story feel complete?

Do not output this planning process.

## Causal progression

Each major event should influence what happens next. Encounters should contribute to the protagonist's goal, reveal character, change a relationship, provide a necessary clue, or create a meaningful consequence.

Avoid a sequence of unrelated places, characters, favors, or magical objects that eventually leads to an arbitrary ending.

Prefer a small number of connected, memorable developments over many shallow scenes.

Not every story needs a villain, danger, or conventional problem. Quiet stories can progress through curiosity, a discovery, a decision, a relationship, a personal accomplishment, or an emotional change.

Challenges should fit the genre and age. They may involve a mistake, uncertainty, conflicting wishes, a puzzle, a practical obstacle, or a difficult choice. Do not manufacture danger merely to make a story exciting.

## Natural emotional resolution and small discoveries

- Let the story's events communicate its emotional meaning. Avoid explaining a lesson that the listener can already infer. Prefer a concrete action, discovery, or change over an explicit moral.
- A story should never end in mere passive sightseeing where characters only observe scenery and fall asleep.
- For ages 4–12, give the characters a small, emotionally meaningful reason for their journey (an obstacle, a wonder, a practical puzzle, or a personal need).
- The journey must result in a small discovery, realization, choice, or gentle change that persists after the journey ends (e.g., discovering how to see a star from home, learning a quiet trick, or making an honest connection).

## Character quality and dialogue restraint

Give important characters:

- A recognizable personality or point of view.
- A clear reason for their actions.
- Natural dialogue appropriate for the character and the child's age. Avoid dialogue that exists mainly to explain the story's theme or moral.
- A meaningful influence on events.

Characters should not exist only to explain the setting, praise the protagonist, or deliver a didactic lecture. Their actions must matter.

Allow believable hesitation, mistakes, disagreement, humor, curiosity, and growth when appropriate. Not every character needs to be unusually kind or immediately helpful.

## Dialogue and imagery restraint

- Use one or two strong sensory details per scene rather than stacking metaphors, personification, and soothing adjectives.
- Avoid poetic overwriting (e.g. stacking "a silver lullaby on the walls", "the night's gentle chorus", "velvet hush").
- Prefer concrete, imaginable actions over confusing metaphors or excessive personification.
- Do not pad a story with descriptions or extra scenes to reach a word count.
- Do not make every problem effortless or every ending identical.

## Originality and anti-repetition

- Make the central premise specific enough to be distinguishable from a generic story.
- Vary protagonists, settings, goals, conflicts, solutions, imagery, and endings across stories when history is available.
- Do not reuse the same plot skeleton with renamed characters.
- Avoid defaulting to stars, moons, glowing objects, talking trees, magical songs, animal helpers, or bedtime journeys unless the premise calls for them.
- Avoid repeating the same descriptive words, sentence openings, dialogue patterns, or emotional beats.
- Ground physical details: If introducing a distinctive physical detail (e.g. steam that smells like vanilla, glowing wheels, or an unusual animal habit), ground it as an established character trait or clear story context. Never introduce unexplained whimsical physical anomalies out of nowhere.
- Specificity over generic bedtime tropes: Avoid stacking generic bedtime elements (fireflies, lavender sky, sleepy owl, magical mist, silver stars) without a specific, memorable premise that connects them.

Originality does not require constant novelty. Familiar themes are welcome when the execution, characters, choices, or emotional insight are distinctive.

# 6. INTERNAL LOGIC AND CONTINUITY

Imaginative events may be impossible in the real world, but they must make sense within the story.

- Establish enough context for important magical events.
- Keep the abilities and limitations of characters and objects consistent.
- Make actions lead to understandable consequences.
- Explain important changes when the resolution depends on them.
- Ensure that the ending follows logically from the story's established setting and events (e.g. if a character's view was blocked from their burrow, establish why or how the ending allows them to rest peacefully).
- Do not introduce a convenient power or object at the last moment to solve the entire problem without preparation.
- Preserve wonder; do not over-explain every magical detail.

## Character and setting continuity

When continuing an existing story or when continuity context is supplied:
- Preserve established character names, pronunciation, appearance, personality, abilities, relationships, setting rules, past events, and unresolved story threads.
- Never rename an established character (e.g., if a companion was named Ruby in a previous story, do not rename them Willow) or invent prior events that contradict the supplied record.
- Reuse established characters when requested or when their return fits naturally. Do not force them into unrelated stories. Never claim persistent memory unless the application supplies the relevant context.

# 7. BEDTIME MODE

When bedtime is requested, the story must remain engaging while becoming progressively calmer.

Use this flexible progression:

- Opening: Establish a safe, inviting situation and a simple purpose.
- Development: Include a connected discovery, gentle challenge, or comforting interaction.
- Resolution: Resolve the central event without frightening danger or intense suspense.
- Wind-down: Gradually reduce activity, urgency, dialogue, and sensory intensity.
- Closing: End with reassurance and a peaceful, complete final image.

The protagonist's actions should contribute to the resolution. Do not use several unrelated encounters merely to prolong the journey.

Use warm, natural, unhurried spoken language. Gentle rhythmic repetition is acceptable when intentional, but avoid repetitive filler.

Toward the end, let the language and events become quieter and simpler. Do not repeatedly announce that characters are sleepy or force a character to fall asleep if the story does not call for it.

Avoid frightening imagery, cliffhangers, sudden surprises, escalating excitement, urgent deadlines, and questions designed to prompt more interaction at bedtime.

Do not sacrifice natural language to insert soothing adjectives, artificial pauses, or exaggerated descriptions. A bedtime story still needs a meaningful narrative.

# 8. LANGUAGE AND LOCALIZATION

Write naturally in the requested language, dialect, and script.

Prioritize idiomatic spoken language over literal translation or ornate prose. Use cultural references only when supported by the supplied context or explicitly requested.

For Tamil:

- Prefer natural, conversational Tamil that a parent might comfortably read aloud.
- Avoid stiff textbook or excessively literary phrasing when everyday speech fits better.
- Use natural dialogue and familiar sentence structures.
- Avoid overly formal forms when a conversational alternative fits the context.
- Do not assume a regional dialect from location alone.
- Use English code-switching only when it fits the requested style.

For every language, preserve meaning, emotional tone, and character voice. Do not translate idioms word-for-word if that sounds unnatural.

# 9. LENGTH AND PACING

Follow an explicitly requested duration or word count when feasible.

Flexible defaults:

- Ages 2–3: 1–3 minutes.
- Ages 4–5: 3–5 minutes.
- Ages 6–8: 4–7 minutes.
- Ages 9–12: 6–10 minutes.

Use approximately 100–130 spoken words per minute as an initial estimate, recognizing that language and TTS speed vary.

Treat the requested duration as a target, not a reason to add filler. If the selected model's output limit is too low, prioritize a complete story and let the application handle length constraints explicitly.

# 10. TTS-READY NARRATION

The story must sound natural when spoken aloud.

- Use clear grammar, manageable sentence lengths, and ordinary punctuation.
- Use clear dialogue attribution and avoid ambiguous pronouns.
- Keep speaker changes easy to follow.
- Choose pronounceable names unless established names must be preserved.
- Preserve the requested language's correct writing system.
- Use punctuation to support natural phrasing without relying on excessive ellipses.
- Avoid excessive semicolons, nested parentheses, abbreviations, emoji, and decorative symbols.
- Avoid repeated letters, excessive onomatopoeia, and written sounds that a TTS engine may pronounce awkwardly.
- Do not include bracketed stage directions, sound-effect labels, or voice instructions in the narration.
- Do not include markdown headings, bullet points, metadata, or production notes in STORY_ONLY.

Natural dialogue and occasional expressive sounds are acceptable when they read smoothly aloud.

Do not insert phonetic guides unless explicitly requested. Preserve character names and intended pronunciation as much as the available text representation allows.

# 11. INTERACTIVE STORIES

Only use interactive mode when explicitly requested or when the application supplies it.

Stop at a meaningful decision point and offer a small number of clear, age-appropriate choices. Do not reveal the consequences of an unresolved choice before the child chooses.

Follow the application's interaction format. Do not resolve the entire story prematurely.

Non-interactive stories must resolve their central narrative before ending.

# 12. SAFETY AND PARENT RESTRICTIONS

Keep content appropriate to the child's age and respect parent-provided restrictions.

Avoid sexual content, graphic violence, dangerous instructions, harmful challenges, and distressing material unsuitable for the age. Do not present unsafe actions as instructions for children to imitate.

For bedtime, avoid unnecessarily frightening or distressing content. For educational stories, distinguish fiction from fact when needed.

Do not request unnecessary personal information or expose private information about a child.

# 13. OUTPUT MODES

Follow the requested mode exactly.

## STORY_ONLY

Return only the complete narration-ready story.

- No introduction, commentary, analysis, metadata, markdown headings, or separate title.
- A dedication or closing blessing is optional when it fits naturally.
- Do not include the internal story plan or quality checklist.
- Leave the story unresolved only when interactive continuation is explicitly requested.

## STRUCTURED_STORY

Return exactly one valid JSON object with these top-level fields:

{
  "title": "Concise story title",
  "language": "Language name or locale",
  "story_text": "Complete narration-ready story",
  "characters_used": [],
  "summary": "Brief story summary",
  "memory_update_candidates": []
}

Requirements:

- title: concise and appropriate; keep it outside story_text.
- language: identify the language actually used.
- story_text: complete narration-ready text without metadata or stage directions.
- characters_used: list the characters featured, using the application's expected representation.
- summary: brief and accurate.
- memory_update_candidates: useful candidate updates grounded in supplied information or explicit story interactions.

Return valid JSON with double-quoted keys and strings. Escape special characters correctly. Do not use markdown fences or add text outside the JSON object. Include exactly the specified fields.

Memory candidates may include an explicitly expressed preference, a newly established recurring fictional character, or a meaningful continuity event. Do not treat fictional events as real-world facts about the child. Do not infer a lasting preference from one incidental detail. Use an empty array when no useful candidate exists.

The application decides whether candidate updates are stored.

# 14. FINAL SILENT QUALITY CHECK

Before returning the answer, silently check:

1. Does the story follow the request, genre, narrative role, language, and parent restrictions?
2. Is it suitable for the child's age and requested duration?
3. Is its premise distinctive rather than a generic sequence of familiar images?
4. Does the protagonist have a clear purpose, discovery, or meaningful experience?
5. Do major events influence what happens next?
6. Do the protagonist's actions or decisions contribute to the resolution?
7. Is the ending earned and complete?
8. Are character behavior and magical rules consistent?
9. Are repetition and descriptive filler limited?
10. Does bedtime pacing become calmer when applicable?
11. Does the narration sound natural when spoken aloud?
12. Does the output match the requested mode exactly?
13. Are all memory candidates grounded and safe?

Revise the story if a major requirement fails. Do not expose this checklist or internal reasoning.

Return only the requested output.`;

export const STORY_REVIEW_PROMPT = `You are a children's story editor. Review the draft against the supplied request, age, genre, output mode, and continuity context.

Evaluate these dimensions:
1. Natural emotional resolution: The story's events must communicate its emotional meaning. Reject or remove dialogue that exists mainly to explain the moral or theme. Prefer a concrete action or change over an explicit lesson.
2. Dialogue and imagery restraint: Dialogue must sound natural for the child's age without didactic speeches. Limit imagery to 1-2 strong sensory details per scene; reject overwritten purple prose (e.g. stacking metaphors like "silver lullaby on walls" and "night's gentle chorus").
3. Character and setting continuity: When continuing an existing story, preserve established character names, traits, and past events. Never rename known characters (e.g. renaming Ruby to Willow) or contradict established rules. Ensure the ending follows logically from the setting (e.g. if a view was blocked from a burrow, explain why the character can now rest peacefully).
4. Premise clarity and distinctiveness: Ensure at least one distinctive, memorable detail or premise instead of stacked generic tropes. Ground any unusual traits (e.g. scented steam) or remove them.
5. Causal progression between major events: Encounters must have clear purpose.
6. Completeness: Ensure the story has a fully completed, comforting ending with proper punctuation. Never leave a story truncated mid-sentence.
7. Age appropriateness and natural TTS narration.

Reject or revise a draft if it contains a major continuity contradiction, an unresolved central premise, unrelated scenes that do not advance the story, preachy moralizing dialogue, overwritten stacked metaphors, or an incomplete/cut-off ending.

If the draft has only minor stylistic weaknesses, preserve its good qualities. If it has a substantive weakness, revise the draft while retaining the requested characters, tone, language, and length.

Do not add events to previous-story history that are not supported by the supplied context. Do not reveal your evaluation or editing process.

Return only the final story in the exact requested output format.`;

export interface IStoryValidationResult {
  isValid: boolean;
  isComplete: boolean;
  hasSentencePunctuation: boolean;
  reasons: string[];
}

export interface INarrativeQualityResult {
  isSatisfactory: boolean;
  isComplete: boolean;
  score: number;
  reasons: string[];
}

export function evaluateNarrativeQuality(
  narration: string,
  age: number,
  finishReason?: string,
  isContinuity: boolean = false,
  expectedCharacters: string[] = []
): INarrativeQualityResult {
  const reasons: string[] = [];
  const trimmed = (narration || '').trim();

  // 1. Completion & sentence termination
  const hitLengthLimit = finishReason === 'length';
  if (hitLengthLimit) {
    reasons.push('Model reached max_completion_tokens limit (finish_reason=length)');
  }
  const cleanEnd = trimmed.replace(/[\s\n\r]+$/, '');
  const hasValidPunctuation = /[.!?…”"']$/.test(cleanEnd);
  if (!hasValidPunctuation) {
    reasons.push(`Text ends abruptly without sentence-ending punctuation (ends with "${cleanEnd.slice(-15)}")`);
  }

  // 2. Minimum length check tuned to age
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  if (age <= 3 && words < 75) {
    reasons.push(`Story is too brief for age ${age} (${words} words)`);
  } else if (age >= 4 && words < 180) {
    reasons.push(`Narrative is underdeveloped for age ${age} (${words} words)`);
  }

  // 3. Didactic / moral lecturing check
  const moralMarkers = [/the moral (is|was)/i, /this teaches us/i, /remember to always/i, /the lesson is/i];
  for (const m of moralMarkers) {
    if (m.test(trimmed)) {
      reasons.push('Contains explicit didactic moralizing or theme explanation');
      break;
    }
  }

  // 4. Overwritten purple prose / cliché stacking
  const purpleHits = (trimmed.match(/silver lullaby|gentle chorus|velvety hush|starry embrace|velvet blanket|moonlit whisper/gi) || []).length;
  if (purpleHits >= 2) {
    reasons.push(`Overwritten poetic imagery detected (${purpleHits} cliché phrases stacked)`);
  }

  // 5. Continuity check (if continuity requested)
  if (isContinuity && expectedCharacters.length > 0) {
    const missing = expectedCharacters.filter((c) => !trimmed.includes(c));
    if (missing.length > 0) {
      reasons.push(`Missing established continuity characters: ${missing.join(', ')}`);
    }
  }

  // 6. JSON / Code leak check (TTS safety)
  if (trimmed.includes('{"') || trimmed.includes('"}') || trimmed.includes('```')) {
    reasons.push('Story text contains raw JSON or markdown code delimiters');
  }

  const isComplete = !hitLengthLimit && hasValidPunctuation;
  const isSatisfactory = isComplete && reasons.length === 0;
  return {
    isSatisfactory,
    isComplete,
    score: Math.max(1, 10 - reasons.length * 2),
    reasons,
  };
}

export function validateStoryCompleteness(text: string, finishReason?: string): IStoryValidationResult {
  const res = evaluateNarrativeQuality(text, 5, finishReason);
  return {
    isValid: res.isSatisfactory,
    isComplete: res.isComplete,
    hasSentencePunctuation: /[.!?…”"']$/.test((text || '').trim()),
    reasons: res.reasons,
  };
}

export class JobExecutionService {
  async submitPipelineJob(dto: IAIPipelineJobDTO): Promise<IAIJobResult> {
    const jobId = uuidv4();
    const timestamp = new Date().toISOString();

    logger.info(`📋 [JobExecutionService] Pipeline job submitted: jobId=${jobId}, type=${dto.jobType}, project=${dto.ownerProject}, ref=${dto.externalReferenceId || 'none'}`);

    await aiJobDao.createJob({
      jobId,
      jobType: dto.jobType,
      ownerProject: dto.ownerProject,
      externalReferenceId: dto.externalReferenceId,
      requestPayload: dto.payload,
      status: 'PENDING',
      progressPercent: 0,
      stageMessage: 'Queued for processing',
      createdAt: timestamp,
      updatedAt: timestamp,
      expiresAt: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days retention
    });

    await this.executeJob(jobId, dto);

    const completedJob = await aiJobDao.getJob(jobId);
    return {
      jobId,
      status: (completedJob?.status as any) || 'COMPLETED',
      progressPercent: completedJob?.progressPercent || 100,
      result: completedJob?.resultPayload,
      errorMessage: completedJob?.errorMessage,
      createdAt: completedJob?.createdAt || timestamp,
      completedAt: (completedJob as any)?.completedAt || new Date().toISOString(),
    };
  }

  async executeJob(jobId: string, dto: IAIPipelineJobDTO): Promise<void> {
    const jobStartTime = Date.now();
    try {
      logger.info(`⚙️ [JobExecutionService] Starting 5-layer pipeline job ${jobId}`);
      await aiJobDao.updateJobProgress(jobId, 10, 'Building context and story parameters...');

      const payload = dto.payload;

      // ======================================================================
      // LAYER 1: Story Request Parsing
      // ======================================================================
      const childName = payload.childName || 'நிலா';
      const childAge = Number(payload.childAge || 5);
      const interests = payload.interests || 'குட்டி ரயில், நிலா, இரவுப் பயணம்';
      const genre = payload.genre || 'Bedtime';
      const narrativeRole = payload.narrativeRole || 'STORYBOOK_CHARACTER';
      const targetDurationMinutes = Number(payload.targetDurationMinutes || 3);
      const outputMode = payload.outputMode || 'STORY_ONLY';
      const languageCode = payload.languageCode || 'ta-IN';
      const language = payload.language || (languageCode === 'en-US' ? 'English' : 'Tamil (conversational spoken Tamil / எளிய பேச்சுத் தமிழ்)');
      const enableQualityReview = Boolean(payload.enableQualityReview ?? false);
      const llmProvider = payload.llmProvider || payload.provider;
      const model = payload.model || (process.env.GROQ_API_KEY ? 'openai/gpt-oss-120b' : 'gpt-4o-mini');

      // ======================================================================
      // LAYER 2: Context Builder (Structured Continuity State)
      // ======================================================================
      const seriesState: IStorySeriesState | undefined = payload.seriesState;
      let continuityPromptSection = '';

      if (seriesState) {
        const charNames = Object.keys(seriesState.characters || {}).join(', ');
        const lastStory = seriesState.lastStory;
        const lastSummary = lastStory?.summary || '';
        const lastEvents = (lastStory?.events || []).join('; ');
        const recentPremises = (seriesState.recentPremises || []).join(', ');

        continuityPromptSection = `\nPrevious Story Context:
${lastSummary}
Established Events: ${lastEvents}
Established Characters: ${charNames}
Recent Premises (avoid repeating): ${recentPremises}\n`;
      } else if (payload.previousStoryContext) {
        continuityPromptSection = `\nPrevious Story Context:\n${payload.previousStoryContext}\n`;
      }

      const promptBody = payload.promptIdea || `Tell a calming, engaging bedtime story for ${childName}.`;
      const fullPrompt = `Child Profile:
Name: ${childName}
Age: ${childAge}
Interests: ${interests}
Genre: ${genre}
Role: ${narrativeRole}
${continuityPromptSection}Language: ${language}
Target Duration: ${targetDurationMinutes} minutes
Output Mode: ${outputMode}

${promptBody}`;

      // ======================================================================
      // LAYER 3: Story Generation
      // ======================================================================
      await aiJobDao.updateJobProgress(jobId, 25, 'Generating purposeful story narrative...');
      const dynamicTokens = calculateDynamicTokens(childAge, targetDurationMinutes, outputMode === 'STRUCTURED_STORY', model || llmProvider);

      logger.info(`✍️ [JobExecutionService] Step 3: LLM generation (provider=${llmProvider || 'default'}, model=${model}, maxTokens=${dynamicTokens})`);
      const llmStartTime = Date.now();

      const textResult = await llmService.generateText({
        provider: llmProvider,
        model,
        systemInstruction: payload.systemInstruction || STORY_SYSTEM_PROMPT,
        prompt: fullPrompt,
        temperature: payload.temperature ?? 0.6,
        maxTokens: dynamicTokens,
      });

      const llmDuration = Date.now() - llmStartTime;
      logger.info(`✅ [JobExecutionService] Step 3 finished in ${llmDuration}ms (tokens=${textResult.totalTokens})`);

      // ======================================================================
      // LAYER 4: Quality Validator & Editor Review Pass
      // ======================================================================
      await aiJobDao.updateJobProgress(jobId, 50, 'Validating narrative quality & formatting...');
      const rawStory = textResult.text || '';
      let parsedStructured: any = null;
      let finalNarration = '';

      // --- 1. Robust Structured JSON Handling & TTS Protection ---
      if (outputMode === 'STRUCTURED_STORY') {
        let cleanJson = rawStory.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        }
        try {
          parsedStructured = JSON.parse(cleanJson);
          if (parsedStructured && typeof parsedStructured.story_text === 'string') {
            finalNarration = parsedStructured.story_text.trim();
          } else {
            throw new Error('Parsed JSON missing string property story_text');
          }
        } catch (e: any) {
          logger.warn(`⚠️ [JobExecutionService] Direct JSON parse failed (${e.message}). Attempting regex field extraction...`);
          // Regex fallback to extract story_text safely without exposing JSON envelope to TTS
          const match = cleanJson.match(/"story_text"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
          if (match && match[1]) {
            try {
              finalNarration = JSON.parse(`"${match[1]}"`);
              logger.info(`✅ [JobExecutionService] Successfully extracted story_text via regex fallback.`);
            } catch {
              finalNarration = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }
          } else {
            // Strip any JSON keys and braces to ensure NO raw JSON ever reaches TTS
            logger.error(`❌ [JobExecutionService] Structured JSON completely malformed. Stripping JSON delimiters for TTS safety.`);
            finalNarration = cleanJson
              .replace(/^{\s*"title"[^}]+}/gs, '')
              .replace(/[{}"\\]/g, '')
              .replace(/^\s*(title|story_text|characters_used|summary)\s*:\s*/gim, '')
              .trim();
          }
        }
      } else {
        // In STORY_ONLY mode: strip accidental JSON or markdown code delimiters if present
        let cleanText = rawStory.trim();
        if (cleanText.startsWith('{') && cleanText.includes('"story_text"')) {
          try {
            const temp = JSON.parse(cleanText);
            cleanText = temp.story_text || cleanText;
          } catch {
            const m = cleanText.match(/"story_text"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
            if (m && m[1]) cleanText = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          }
        }
        finalNarration = cleanText;
      }

      // --- 2. Initial Completeness and Quality Evaluation ---
      const expectedChars = seriesState ? Object.keys(seriesState.characters || {}) : [];
      const isContinuityStory = Boolean(seriesState || payload.previousStoryContext);
      let qualityCheck = evaluateNarrativeQuality(
        finalNarration,
        childAge,
        textResult.finishReason,
        isContinuityStory,
        expectedChars
      );

      // --- 3. Auto-Continuation if Cut Off by Token Limit or Missing Termination ---
      if (!qualityCheck.isComplete) {
        logger.warn(`⚠️ [JobExecutionService] Story cut off or incomplete (${qualityCheck.reasons.join('; ')}). Initiating continuation...`);
        try {
          const continuationPrompt = `The bedtime story for ${childName} was cut off before its conclusion.
Here is the story so far:
---
${finalNarration}
---
Continue seamlessly from the exact cutoff point and provide a complete, comforting bedtime resolution and wind-down ending (1-2 paragraphs). Do not repeat what was already written. End with a complete closing sentence. Return ONLY the spoken story continuation text.`;

          const continuationResult = await llmService.generateText({
            provider: llmProvider,
            model,
            systemInstruction: STORY_SYSTEM_PROMPT,
            prompt: continuationPrompt,
            temperature: 0.7,
            maxTokens: 500,
          });

          if (continuationResult.text && continuationResult.text.trim()) {
            finalNarration = `${finalNarration} ${continuationResult.text.trim()}`;
            logger.info(`✅ [JobExecutionService] Continuation appended successfully.`);
            // REVALIDATE after continuation
            qualityCheck = evaluateNarrativeQuality(
              finalNarration,
              childAge,
              continuationResult.finishReason,
              isContinuityStory,
              expectedChars
            );
          }
        } catch (contErr: any) {
          logger.error(`❌ [JobExecutionService] Continuation failed: ${contErr.message}`);
        }
      }

      // --- 4. Quality Gate Review Pass ---
      // Runs when explicitly requested (dev/testing) OR when story fails quality checks (clichés, moralizing, missing chars, JSON leak)
      const shouldRunReview = enableQualityReview || !qualityCheck.isSatisfactory;
      if (shouldRunReview) {
        logger.info(`🔍 [JobExecutionService] Running Quality Gate review pass (reason=${enableQualityReview ? 'requested' : qualityCheck.reasons.join(', ')})...`);
        try {
          const reviewPrompt = `--- ORIGINAL REQUEST & CONTEXT ---
Child Name: ${childName}
Age: ${childAge}
Interests: ${interests}
Genre: ${genre}
Role: ${narrativeRole}
Language: ${language}
${continuityPromptSection}
${promptBody}

--- DRAFT STORY NARRATION ---
${finalNarration}

Review the draft against the criteria. Fix any incomplete ending, moralizing dialogue, purple prose, or continuity issues.
IMPORTANT: Return ONLY the final, clean spoken story narration text. Do NOT wrap in JSON, markdown code fences, or include editor commentary.`;

          const reviewResult = await llmService.generateText({
            provider: llmProvider,
            model,
            systemInstruction: STORY_REVIEW_PROMPT,
            prompt: reviewPrompt,
            temperature: 0.6,
            maxTokens: dynamicTokens,
          });

          let reviewedText = (reviewResult.text || '').trim();
          // Clean any markdown code blocks returned by editor
          if (reviewedText.startsWith('```')) {
            reviewedText = reviewedText.replace(/^```(?:markdown|text|json)?\s*/i, '').replace(/\s*```$/, '').trim();
          }

          if (reviewedText.length > 50) {
            finalNarration = reviewedText;
            logger.info(`✅ [JobExecutionService] Quality Gate review applied successfully.`);
            // REVALIDATE after review
            qualityCheck = evaluateNarrativeQuality(
              finalNarration,
              childAge,
              reviewResult.finishReason,
              isContinuityStory,
              expectedChars
            );
          }
        } catch (revErr: any) {
          logger.warn(`⚠️ [JobExecutionService] Quality Gate review bypassed: ${revErr.message}`);
        }
      }

      // Keep structured object synchronized with finalized narration
      if (parsedStructured) {
        parsedStructured.story_text = finalNarration;
      }

      // Conservative TTS sanitization on completed narration
      finalNarration = sanitizeForTTS(finalNarration);

      // ======================================================================
      // LAYER 5: Finalize and Save (TTS & Structured State Persistence)
      // ======================================================================
      await aiJobDao.updateJobProgress(jobId, 65, 'Synthesizing voice audio...');

      const audioFileName = dto.externalReferenceId
        ? `${dto.externalReferenceId}_${Date.now()}`
        : jobId;
      const resolvedVoiceId = payload.aiVoiceId || payload.voiceId;
      const resolvedProvider = payload.ttsProvider || payload.voiceProvider || payload.provider;
      const resolvedSpeaker = payload.speaker || payload.voiceName || resolvedVoiceId;

      logger.info(`🎙️ [JobExecutionService] Step 5: Synthesizing TTS audio (speaker=${resolvedSpeaker || 'default'}, provider=${resolvedProvider || 'default'})`);
      const ttsStartTime = Date.now();

      const speechResult = await ttsService.synthesizeSpeech({
        text: finalNarration,
        provider: resolvedProvider,
        speaker: resolvedSpeaker,
        aiVoiceId: resolvedVoiceId,
        languageCode,
        speakingRate: payload.speakingRate || 0.9,
        emotion: payload.emotion || 'bedtime_calm',
        targetKey: `stories/${audioFileName}.mp3`,
      });

      const ttsDuration = Date.now() - ttsStartTime;
      logger.info(`✅ [JobExecutionService] Step 5 finished in ${ttsDuration}ms (audioDuration=${speechResult.durationSeconds}s)`);

      await aiJobDao.updateJobProgress(jobId, 90, 'Finalizing story persistence & metadata...');

      // --- Real Continuity State Extraction ---
      const derivedPremise = (payload.promptIdea || `${genre} story for ${childName}`).slice(0, 100).replace(/\n/g, ' ').trim();
      const narrativeParagraphs = finalNarration.split(/\n\n+/).filter((p) => p.trim().length > 25);

      const milestoneEvents: string[] = [];
      if (parsedStructured?.events && Array.isArray(parsedStructured.events) && parsedStructured.events.length > 0) {
        milestoneEvents.push(...parsedStructured.events);
      } else {
        if (narrativeParagraphs.length >= 1) {
          milestoneEvents.push(`Beginning: ${narrativeParagraphs[0].replace(/\n/g, ' ').slice(0, 110)}...`);
        }
        if (narrativeParagraphs.length >= 3) {
          const mid = Math.floor(narrativeParagraphs.length / 2);
          milestoneEvents.push(`Journey: ${narrativeParagraphs[mid].replace(/\n/g, ' ').slice(0, 110)}...`);
        }
        if (narrativeParagraphs.length >= 2) {
          const last = narrativeParagraphs[narrativeParagraphs.length - 1];
          milestoneEvents.push(`Resolution: ${last.replace(/\n/g, ' ').slice(0, 110)}...`);
        }
      }

      const mergedCharacters = {
        ...(seriesState?.characters || {}),
      };
      if (Array.isArray(parsedStructured?.characters_used)) {
        for (const ch of parsedStructured.characters_used) {
          if (!mergedCharacters[ch]) {
            mergedCharacters[ch] = { type: 'character', traits: ['friendly'] };
          }
        }
      }

      const storySummary = parsedStructured?.summary || (
        narrativeParagraphs.length > 1
          ? `${narrativeParagraphs[0].slice(0, 100)}... In the end, ${narrativeParagraphs[narrativeParagraphs.length - 1].slice(0, 100)}`
          : finalNarration.slice(0, 180) + '...'
      );

      const updatedContinuityRecord = {
        seriesId: seriesState?.seriesId || `series_${childName.toLowerCase()}`,
        characters: mergedCharacters,
        lastStory: {
          title: parsedStructured?.title || `${genre} story for ${childName}`,
          summary: storySummary,
          events: milestoneEvents,
        },
        recentPremises: Array.from(new Set([
          ...(seriesState?.recentPremises || []),
          derivedPremise,
        ])).slice(-5),
      };

      const totalJobDuration = Date.now() - jobStartTime;
      logger.info(`🎉 [JobExecutionService] Job ${jobId} successfully completed in ${totalJobDuration}ms! Audio URL: ${speechResult.audioUrl}`);

      await aiJobDao.completeJob(
        jobId,
        {
          storyScript: finalNarration,
          structuredData: parsedStructured,
          continuityRecord: updatedContinuityRecord,
          audioUrl: speechResult.audioUrl,
          audioS3Key: speechResult.audioS3Key,
          durationSeconds: speechResult.durationSeconds,
          backgroundMusic: payload.ambientMusic?.trackId || 'gentle_lullaby',
        },
        {
          tokens: textResult.totalTokens,
          seconds: speechResult.durationSeconds,
        }
      );
    } catch (error: any) {
      logger.error(`❌ [JobExecutionService] Job ${jobId} failed: ${error.message}`, { stack: error.stack });
      await aiJobDao.failJob(jobId, error.message || 'Unknown processing error');
    }
  }

  async getJobStatus(jobId: string): Promise<IAIJobResult | null> {
    const job = await aiJobDao.getJob(jobId);
    if (!job) return null;

    return {
      jobId: job.jobId,
      status: job.status,
      progressPercent: job.progressPercent,
      result: job.resultPayload,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      completedAt: (job as any).completedAt,
    };
  }
}

export default new JobExecutionService();
