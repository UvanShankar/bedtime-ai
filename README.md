# Bedtime AI — Parent Voice Story MVP

A production-minded AI bedtime story platform featuring a modular Node.js TypeScript backend and a React Native Expo mobile application. The platform clones parent voice profiles, extracts parent storytelling and linguistic style from voice samples, crafts structured bedtime stories via LLM with bedtime-calming narration directives, and generates soothing audio playback via pluggable TTS engines.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Mobile["Mobile App (React Native Expo)"]
        S1["Screen 1: Parent & Child Profile"]
        S2["Screen 2: Voice Consent & Recording"]
        S3["Screen 3: Bedtime Story Request"]
        S4["Screen 4: Audio Player & Story View"]
    end

    subgraph Backend["Node.js TypeScript Backend"]
        Router["Express API Router (/api/v1)"]
        Controllers["Controllers: Parent, Child, Voice, Story"]
        Narration["Narration Director (Progressive Bedtime Deceleration)"]
        Strategy["AudioStrategy (Full-File / Streaming A/B)"]
    end

    subgraph Registries["Pluggable Provider Registries"]
        LLM["LLM Provider (OpenAI / Mock)"]
        TTS["TTS Provider (Sarvam / ElevenLabs / Mock)"]
        VoiceClone["Voice Clone Provider (Sarvam / ElevenLabs / Mock)"]
        STT["STT Provider (Whisper / Mock)"]
        Storage["Storage Provider (Private S3 / Local / Mock)"]
    end

    S1 -->|POST /parents, /children| Router
    S2 -->|POST /parents/:id/voice (multipart)| Router
    S3 -->|POST /stories/generate| Router
    Router --> Controllers
    Controllers --> LLM
    Controllers --> STT
    Controllers --> VoiceClone
    Controllers --> Narration
    Narration --> Strategy
    Strategy --> TTS
    Strategy --> Storage
    Storage -->|Presigned URL| S4
```

---

## 🚀 Key Architectural Features

1. **Provider Isolation & Pluggability**:
   - Business logic never imports external SDKs directly.
   - Provider adapters (`LLMProvider`, `TTSProvider`, `VoiceCloneProvider`, `StorageProvider`, `SpeechToTextProvider`) conform to strict TypeScript interfaces.
   - Switch providers purely via environment variables (`LLM_PROVIDER`, `TTS_PROVIDER`, `VOICE_PROVIDER`, `STORAGE_PROVIDER`).

2. **A/B Testing Architecture for Audio**:
   - Supports seamless toggling between `full_file` and `streaming` modes without rewriting mobile client logic.
   - Decoupled `AudioStrategy` and `AudioSource` abstractions.

3. **Parent Voice & Privacy First**:
   - Explicit consent check before processing or cloning voice samples.
   - Audio stored in private S3 buckets (`parents/{parentId}/voice/source/{uuid}.wav`).
   - Short-lived pre-signed URLs (`SIGNED_URL_EXPIRY_SECONDS=900`) for audio streaming and playback.
   - Deletion endpoint (`DELETE /api/v1/parents/:parentId/voice`) removes provider voice profiles and S3 artifacts.

4. **Sociolinguistic Style Analyzer**:
   - Analyzes spoken transcripts for dialect, sentence length, warmth, affection, pacing, and family expressions.
   - Injects parent voice personas into LLM prompts without exposing raw voice biometrics.

5. **Narration Director**:
   - Computes delivery metadata (emotion, energy, pace, pause before/after) on story segments.
   - Features **Bedtime Deceleration**: progressively slows pacing and lengthens pauses toward the conclusion of the bedtime story.

6. **Zero Mobile Secrets**:
   - The Expo client contains no AWS keys, OpenAI keys, or TTS credentials. All calls route securely through the backend.

---

## 📁 Repository Structure

```text
bedtime-ai/
├── backend/
│   ├── src/
│   │   ├── audio/strategies/     # Full-file and streaming audio strategies
│   │   ├── config/               # Typed environment configuration
│   │   ├── errors/               # Standardized error codes & AppError
│   │   ├── middleware/           # Zod validation & global error handler
│   │   ├── modules/              # Controllers (parents, children, voices, stories)
│   │   ├── prompts/              # StoryPromptBuilder & StyleAnalysisPromptBuilder
│   │   ├── providers/            # Pluggable adapters (OpenAI, Sarvam, ElevenLabs, S3, Local, Mock)
│   │   ├── repositories/         # Domain repositories
│   │   ├── routes/               # Express API v1 routes
│   │   ├── services/             # NarrationDirector, StyleAnalyzer
│   │   ├── types/                # Domain models & provider interfaces
│   │   ├── app.ts                # Application factory
│   │   └── server.ts             # Backend entry point
│   ├── tests/                    # Unit tests & supertest integration tests
│   ├── .env.example
│   └── package.json
│
├── mobile/
│   ├── src/
│   │   ├── components/           # VoiceRecorder, AudioPlayer, StoryCard, LoadingState, ErrorState
│   │   ├── config/               # Mobile runtime config
│   │   ├── hooks/                # useVoiceRecorder, useAudioPlayer (AudioPlayerController)
│   │   ├── models/               # Client-side domain models
│   │   ├── navigation/           # React Navigation stack
│   │   ├── screens/              # 4 screens: ParentChild, VoiceSetup, StoryRequest, StoryResult
│   │   └── services/api/         # ApiClient, ParentApi, VoiceApi, StoryApi
│   ├── App.tsx                   # Mobile entry point
│   ├── app.json
│   └── package.json
└── README.md
```

---

## 🛠️ Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24.19)
- **npm** (v10+)
- **Expo Go** or Mobile emulator (for React Native)

---

### 2. Backend Setup

```bash
cd backend

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Run test suite (8 tests passing across 4 suites)
npm test

# Start the development server
npm run dev
```

The backend starts at `http://localhost:3000`. By default, it runs with `LLM_PROVIDER=mock`, `TTS_PROVIDER=mock`, `STORAGE_PROVIDER=local`, allowing you to run and test everything out of the box without external paid keys!

#### To configure live providers in `.env`:
```ini
# Storage
STORAGE_PROVIDER=s3
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_STORY_MODEL=gpt-4o-mini

# Sarvam (Indian Languages)
TTS_PROVIDER=sarvam
VOICE_PROVIDER=sarvam
SARVAM_API_KEY=your-sarvam-key

# Or ElevenLabs
# TTS_PROVIDER=elevenlabs
# VOICE_PROVIDER=elevenlabs
# ELEVENLABS_API_KEY=your-elevenlabs-key

# Audio Mode
AUDIO_MODE=full_file
```

---

### 3. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start
```

Press `w` in terminal for web preview, or scan the QR code with **Expo Go** on Android/iOS.

---

## 📡 API Reference

### 1. Parents & Children
- `POST /api/v1/parents` — Create parent profile (`name`, `relationship`, `language`, `languageCode`, `dialect`, `script`).
- `GET /api/v1/parents/:parentId` — Get parent details.
- `POST /api/v1/children` — Create child profile (`parentId`, `name`, `age`, `interests`, `personality`, `avoidTopics`).
- `GET /api/v1/children/parent/:parentId` — List children for a parent.

### 2. Voice & Style
- `POST /api/v1/parents/:parentId/voice` (multipart `audio`, `consent="true"`)
  - Validates audio and consent.
  - Uploads raw audio to private S3 storage (`parents/{parentId}/voice/source/{uuid}.wav`).
  - Calls Voice Clone provider.
  - Transcribes audio and saves transcript.
  - Analyzes storytelling style and stores `ParentStyleProfile`.
- `GET /api/v1/parents/:parentId/voice` — Get active voice profile.
- `DELETE /api/v1/parents/:parentId/voice` — Deletes voice profile from provider and S3 storage.

### 3. Story Generation & Audio
- `POST /api/v1/stories/generate`
  - Input:
    ```json
    {
      "parentId": "string",
      "childId": "string",
      "topic": "A little elephant who cannot sleep",
      "storyType": "bedtime adventure",
      "mood": "warm and funny",
      "durationMinutes": 5,
      "bedtimeCalmness": 0.95,
      "includeChildName": true,
      "realWorldFacts": false,
      "additionalInstruction": "Soft lullaby ending"
    }
    ```
  - Output: Returns structured story with segments, narration directives, and pre-signed playback `audioUrl`.
- `GET /api/v1/stories/:storyId` — Fetch story and refresh signed audio URL.
- `GET /api/v1/stories/:storyId/stream` — Streaming audio endpoint for streaming A/B mode.

---

## 🧪 Testing

Run tests across unit and integration suites:
```bash
cd backend
npm test
```

Suite includes:
- `prompts.test.ts`: Enforces system boundaries, child personalization, prompt-injection defense.
- `narration.test.ts`: Verifies progressive bedtime deceleration and pause scaling.
- `registry.test.ts`: Tests provider pluggability and adapter resolution.
- `api.test.ts`: Full end-to-end integration test (Parent -> Child -> Voice Upload -> Story Generation -> Retrieval -> Deletion).
