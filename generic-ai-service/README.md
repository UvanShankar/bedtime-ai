# Generic AI Service

A standalone, multi-tenant AI engine providing LLM text generation, speech synthesis (TTS), voice cloning, and asynchronous pipeline execution for any frontend or domain backend.

## Architecture

- **Pattern**: Follows the `PurpleOneService` structure with `routes/`, `controller/`, `services/`, `dao/`, `models/`, and standard envelope `IResponse<Data, ErrorType>`.
- **Decoupled Providers**:
  - LLM: `GeminiProvider` (with Tamil bedtime story prompts & structured JSON output), `MockLLMProvider` (offline fallback).
  - TTS: `ElevenLabsProvider` (streaming and audio output), `MockTTSProvider` (generates silent/demo MP3).
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
- `POST /api/v1/ai/jobs/pipeline`: Enqueue async story/voice pipeline.
- `GET /api/v1/ai/jobs/:jobId`: Query status of background AI job.

### ChatGPT Wrapper Example

**Request (`POST /api/v1/ai/chat`):**
```json
{
  "text": "What is bedtime story?",
  "systemPrompt": "You are a friendly assistant.",
  "model": "gpt-4o-mini",
  "temperature": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "inputText": "What is bedtime story?",
    "outputText": "A bedtime story is a traditional form of storytelling where a story is told to a child at bedtime...",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "usage": {
      "promptTokens": 15,
      "completionTokens": 45,
      "totalTokens": 60
    }
  },
  "error": null
}
```

## Local Development

```bash
# 1. Install dependencies
npm.cmd install

# 2. Configure .env (copied from .env.example)
cp .env.example .env

# 3. Build & Run
npm.cmd run build
npm.cmd run dev
```
