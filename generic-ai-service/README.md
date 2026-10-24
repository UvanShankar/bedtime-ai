# Generic AI Service

A standalone, multi-tenant AI engine providing LLM text generation, speech synthesis (TTS), voice cloning, and asynchronous pipeline execution for any frontend or domain backend.

## Architecture

- **Pattern**: Follows the `PurpleOneService` structure with `routes/`, `controller/`, `services/`, `dao/`, `models/`, and standard envelope `IResponse<Data, ErrorType>`.
- **Decoupled Providers**:
  - LLM: `GroqProvider` (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`), `OpenAIProvider`, `GeminiProvider`, `MockLLMProvider` (offline fallback).
  - TTS: `ElevenLabsProvider`, `CartesiaProvider`, `MockTTSProvider` (generates silent/demo MP3).
- **Multi-tenant**: Requests pass an API Key (`x-api-key`) and specify `ownerProject` (e.g., `"nila"`).
- **DynamoDB Tables**:
  - `AI_VoiceRegistry_<env>`: Registered voice models per project & external reference.
  - `AI_Jobs_<env>`: Async background task tracking.

## API Endpoints

- `GET /healthy`: Service health check.
- `POST /api/v1/ai/chat`: **ChatGPT Wrapper API** — Send input text, get output response text (supports `text`, `prompt`, `messages`, `systemPrompt`, `model`, `temperature`).
- `POST /api/v1/ai/text/generate`: Generic LLM text generation with template interpolation.
- `POST /api/v1/ai/text/structured`: JSON Schema-guided structured LLM generation.
- `POST /api/v1/ai/speech/synthesize`: Text-to-speech synthesis (returns S3 audio URL).
- `POST /api/v1/ai/voice/clone`: Clone a voice from uploaded sample audio URLs.
- `GET /api/v1/ai/voice/:aiVoiceId`: Fetch registered voice metadata.
- `POST /api/v1/ai/jobs/pipeline`: Enqueue async story/voice pipeline (`STORY_PIPELINE` or `VOICE_ONBOARDING_PIPELINE`).
- `GET /api/v1/ai/jobs/:jobId`: Query status of background AI job.

---

## Bedtime Story Pipeline (`STORY_PIPELINE`)

The storytelling engine features an automated multi-layer pipeline:
1. **Dynamic Token Budgeting**: Calculates output tokens tailored to child age (Ages 2–3: 850 base, Ages 4–5: 1300 base, Ages 6–12: 1750–2048) with reasoning token headroom.
2. **Layered Narrative Architecture**:
   - Frozen 14-section system prompt enforcing causal progression, narrative restraint, and strict character/setting continuity.
   - Default generation temperature tuned to `0.6` for `openai/gpt-oss-120b` (eliminates purple prose clichés and reasoning drift).
3. **Automated Quality Gate**: In-line validation checking sentence completion, age suitability, didactic moralizing markers, and cliché stacking. Auto-triggers second-pass revision if quality checks fail.
4. **TTS Formatting Hygiene**: Guaranteed markdown stripping, code fence cleanup, and bracketed cue removal to ensure raw JSON never reaches TTS narration.
5. **Continuity Persistence**: Extracts narrative milestones (`Beginning`, `Journey`, `Resolution`), derived premises, and character memory into `continuityRecord`.

### Running Story Tests (CLI)

Use the built-in test runner to execute story pipelines without fragile terminal shell-escaping:

```bash
# Run Preset 1: Bramble the Hedgehog (Age 5, Lantern Workshop)
npm run story 1

# Run Preset 2: Oliver the Clockmaker (Age 7, Quietest Gear)
npm run story 2

# Run Preset 3: Barnaby Puppy (Age 2-3, Lost Blanket)
npm run story 3

# Run Preset 4: Pip Series Continuity (Age 5, Starlight Pinecone)
npm run story 4

# Run Preset 5: Spoken Tamil Bedtime (Age 5, Nila Train Lullaby)
npm run story 5

# Or run with a custom story prompt:
node test-story.js "Pip and the firefly discover the singing cricket by the stream."
```

### Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure .env from .env.example
cp .env.example .env
# Set your GROQ_API_KEY in .env

# 3. Build & Run
npm run build
npm run start
```

