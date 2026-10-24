# Generic AI Service

A standalone, multi-tenant AI platform providing child-personalized bedtime story generation, speech synthesis (TTS), voice cloning, and asynchronous pipeline execution for frontend and backend consumers.

---

## Architecture Overview

- **Design Pattern**: Follows the `PurpleOneService` structure with `routes/`, `controller/`, `services/`, `dao/`, `models/`, and standard envelope `IResponse<Data, ErrorType>`.
- **Decoupled Providers**:
  - **LLM Providers**:
    - `GroqProvider`: Extreme inference speed via Groq LPU (`openai/gpt-oss-120b` for deep narrative causality; `qwen/qwen3.8-27b` for sub-3-second conversational Tamil).
    - `OpenAIProvider`: Direct OpenAI API (`gpt-4o`, `gpt-4o-mini`).
    - `GeminiProvider`: Google Gemini SDK (`gemini-2.0-flash`).
    - `MockLLMProvider`: Offline deterministic simulation for testing without network/API keys.
  - **TTS Providers**:
    - `ElevenLabsProvider`: High-fidelity voice synthesis.
    - `CartesiaProvider`: Low-latency conversational audio streaming.
    - `SarvamProvider`: Specialized Indic / Tamil voice narration.
    - `MockTTSProvider`: Generates demo MP3 audio for offline end-to-end testing.
- **Multi-tenant Security**: Requests pass an API Key (`x-api-key`) and specify `ownerProject` (e.g., `"nila"`).
- **Persistence (DynamoDB & S3)**:
  - `AI_VoiceRegistry_<env>`: Voice cloning metadata and audio references.
  - `AI_Jobs_<env>`: Background asynchronous job state machine.
  - S3 / LocalStack: Story audio storage and presigned playback URLs.

---

## How to Get Required API Keys

| Provider | Purpose | How to Obtain Key | Env Variable |
| :--- | :--- | :--- | :--- |
| **Groq** *(Recommended)* | High-speed LLM story synthesis on LPUs | 1. Go to [Groq Console](https://console.groq.com/keys)<br>2. Sign in or create a free account<br>3. Click **"Create API Key"** and copy the string (starts with `gsk_...`) | `GROQ_API_KEY` |
| **OpenAI** | Alternative LLM provider (`gpt-4o`) | 1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)<br>2. Create a new secret key | `OPENAI_API_KEY` |
| **Google Gemini** | Alternative LLM provider (`gemini-2.0-flash`) | 1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)<br>2. Click **"Create API Key"** in a Google Cloud project | `GEMINI_API_KEY` |
| **ElevenLabs** | Primary TTS voice synthesis | 1. Go to [ElevenLabs](https://elevenlabs.io)<br>2. Navigate to **Profile -> API Keys** and generate key | `ELEVENLABS_API_KEY` |
| **Cartesia** *(Optional)* | Ultra-low latency voice streaming | 1. Go to [Cartesia Console](https://play.cartesia.ai/console)<br>2. Generate an API Key | `CARTESIA_API_KEY` |
| **Sarvam AI** *(Optional)* | Indic & Tamil regional voice synthesis | 1. Go to [Sarvam Dashboard](https://dashboard.sarvam.ai)<br>2. Generate an API Key | `SARVAM_API_KEY` |

> [!NOTE]
> For offline local development and testing, **all providers gracefully fall back to mock modes** if their API keys are omitted.

---

## Step-by-Step Setup Guide

### 1. Prerequisites
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **LocalStack** *(optional, for local AWS S3/DynamoDB emulation)*: `http://localhost:4566`

### 2. Install Dependencies
```bash
cd generic-ai-service
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to create `.env`:
```bash
cp .env.example .env
```

Edit `.env` and set your configuration:
```env
PORT=8082
NODE_ENV=development
AWS_REGION=ap-south-1

# Local service authentication key (sent as x-api-key)
AI_SERVICE_API_KEY=test-ai-key-secret-12345

# AI Provider API Keys
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# AWS / LocalStack endpoints
DYNAMODB_ENDPOINT=http://localhost:4566
S3_ENDPOINT=http://localhost:4566
```

### 4. Build and Start the Service
```bash
# Compile TypeScript
npm run build

# Start production server
npm run start

# OR start in development watch mode
npm run dev
```

Verify service health:
```bash
curl http://localhost:8082/healthy
# Expected: {"status":"ok","service":"generic-ai-service","timestamp":"..."}
```

---

## Bedtime Story Pipeline (`STORY_PIPELINE`)

The storytelling engine executes a 5-layer pipeline:
1. **Dynamic Token Budgeting**: Automatically calculates token budgets according to child age (Ages 2–3: 850 base; Ages 4–5: 1300 base; Ages 6–12: 1750–2048) with reasoning token headroom.
2. **Layered Narrative Architecture**:
   - Frozen 14-section system prompt enforcing causal progression, age-appropriate vocabulary, natural emotional resolution, dialogue/imagery restraint, and strict character/setting continuity.
   - Default generation temperature tuned to `0.6` on `openai/gpt-oss-120b` (eliminates purple prose clichés and reasoning drift).
3. **Automated Quality Gate**: In-line validation (`evaluateNarrativeQuality`) checking sentence completion, minimum word counts, didactic moralizing markers, and cliché stacking. Auto-triggers a second-pass revision if quality checks fail.
4. **TTS Formatting Hygiene**: Guaranteed markdown stripping, code fence cleanup, and bracketed cue removal to ensure raw JSON/formatting never reaches voice narration.
5. **Continuity Persistence**: Extracts narrative milestones (`Beginning`, `Journey`, `Resolution`), derived premises, and character memory into `continuityRecord`.

---

## Testing & Benchmarking Guide

### Method 1: Built-in CLI Presets (`npm run story`)

The easiest way to test without shell-escaping issues:

```bash
# Preset 1: Bramble the Hedgehog (Age 5, Bedtime, English)
npm run story 1

# Preset 2: Oliver the Clockmaker (Age 7, Bedtime Mystery, English)
npm run story 2

# Preset 3: Barnaby Puppy (Ages 2-3, Simple Toddler Story, English)
npm run story 3

# Preset 4: Pip Series Continuity (Age 5, Continuity Cast: Pip, Rosie, Gabe)
npm run story 4

# Preset 5: Spoken Tamil Bedtime (Age 5, Conversational Spoken Tamil)
npm run story 5

# Custom Story Prompt:
node test-story.js "Pip and the firefly discover a singing cricket by the stream."
```

### Method 2: Automated 5-Case Rubric Benchmark (`groqTesting.py`)

A standalone benchmarking and evaluation tool is located at `scrapAndTests/groqTesting.py`:

```bash
# 1. Run full 5-case benchmark suite on GPT-OSS 120B
python3 ../scrapAndTests/groqTesting.py -m openai/gpt-oss-120b -B

# 2. Run temperature comparison experiment (T=0.6 vs T=0.8)
python3 ../scrapAndTests/groqTesting.py -m openai/gpt-oss-120b -C 0.6 0.8

# 3. Benchmark extreme-speed Tamil on Qwen 27B
python3 ../scrapAndTests/groqTesting.py -m qwen/qwen3.8-27b -B
```

**Evaluated Rubric Dimensions (1.0 to 10.0 scale)**:
- **Narrative Progression**: Presence of a clear central event and cause-and-effect progression.
- **Age Suitability**: Word count matching target child developmental age.
- **Continuity Adherence**: Strict preservation of established recurring characters and setting facts.
- **Natural Dialogue & Moral Restraint**: Zero didactic lecturing or explicit moral explanations.
- **Imagery Restraint**: Automatic cliché audit tracking phrases like *"silver lullaby"*, *"velvety hush"*, *"starry embrace"*.
- **TTS Readiness**: Clean punctuation, absence of markdown asterisks, headers, or bracketed stage cues.
- **Calm Bedtime Wind-Down**: Restful closure with calming sleep-inducing cadence.

### Method 3: Direct API Request via cURL

To avoid zsh control-character syntax errors when submitting multi-line JSON, use a payload file:

```bash
# 1. Create or edit payload.json
cat << 'EOF' > payload.json
{
  "jobType": "STORY_PIPELINE",
  "ownerProject": "nila",
  "externalReferenceId": "story_bramble_test",
  "payload": {
    "childName": "Aarav",
    "childAge": 5,
    "interests": "Forest animals, tiny lanterns, bedtime coziness",
    "genre": "Bedtime",
    "narrativeRole": "STORYBOOK_CHARACTER",
    "language": "English",
    "languageCode": "en-US",
    "targetDurationMinutes": 3,
    "llmProvider": "groq",
    "ttsProvider": "mock",
    "enableQualityReview": true,
    "promptIdea": "Bramble the little hedgehog carries a sleepy firefly home to the Willow Grove."
  }
}
EOF

# 2. Submit the job
curl -s -X POST http://localhost:8082/api/v1/ai/jobs/pipeline \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-ai-key-secret-12345" \
  -d @payload.json | jq .
```

---

## API Reference

### 1. Story & Voice Pipeline
- **Endpoint**: `POST /api/v1/ai/jobs/pipeline`
- **Headers**:
  - `Content-Type: application/json`
  - `x-api-key: <AI_SERVICE_API_KEY>`
- **Payload (`STORY_PIPELINE`)**:
  ```json
  {
    "jobType": "STORY_PIPELINE",
    "ownerProject": "nila",
    "externalReferenceId": "story_ref_001",
    "payload": {
      "childName": "Aarav",
      "childAge": 5,
      "interests": "Trains, stars",
      "genre": "Bedtime",
      "language": "English",
      "languageCode": "en-US",
      "targetDurationMinutes": 3,
      "llmProvider": "groq",
      "ttsProvider": "elevenlabs"
    }
  }
  ```

### 2. Query Background Job Status
- **Endpoint**: `GET /api/v1/ai/jobs/:jobId`
- **Headers**: `x-api-key: <AI_SERVICE_API_KEY>`
- **Response**: Returns `status` (`SUBMITTED`, `PROCESSING`, `COMPLETED`, `FAILED`), progress percentage, and `result` (audio URL, duration, script, and continuity record).

### 3. Direct Chat API
- **Endpoint**: `POST /api/v1/ai/chat`
- **Headers**: `x-api-key: <AI_SERVICE_API_KEY>`
- **Body**: `{ "text": "Hello!", "model": "gpt-4o-mini", "temperature": 0.6 }`

### 4. Direct Speech Synthesis
- **Endpoint**: `POST /api/v1/ai/speech/synthesize`
- **Headers**: `x-api-key: <AI_SERVICE_API_KEY>`
- **Body**: `{ "text": "Goodnight little one.", "provider": "elevenlabs", "speaker": "rachel" }`
