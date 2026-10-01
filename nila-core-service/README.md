# Nila Core Service

The core domain backend for the Nila Bedtime Stories application. Handles parent authentication, child profiles, memories & context, voice profiles, story requests, and playback session synchronization.

## Architecture

- **Pattern**: Follows the `PurpleOneService` structure with `routes/`, `controller/`, `services/`, `dao/`, `models/`, and standard envelope `IResponse<Data, ErrorType>`.
- **Multi-Table DynamoDB**:
  - `Nila_Users_<env>`: Parents, auth credentials, subscription tier.
  - `Nila_Otp_<env>`: Mobile / Email OTP verification codes.
  - `Nila_Children_<env>`: Child profiles (name, age, interests, bedtime habits, preferences).
  - `Nila_Memories_<env>`: Family moments, learning milestones, bedtime context.
  - `Nila_VoiceProfiles_<env>`: Parent voice cloning status, sample recordings, consent verification.
  - `Nila_Stories_<env>`: Bedtime stories (text, audio URL, moral, language/dialect, duration).
  - `Nila_PlaybackSessions_<env>`: Real-time playback state (position, completed flag, background sound).
- **AI Integration**: Communicates with `generic-ai-service` via HTTP client (`AIServiceClient`) using standard API keys and asynchronous pipeline triggers.

## API Endpoints

- `GET /healthy`: Service health check.
- **Auth & Onboarding**:
  - `POST /api/v1/auth/register`: Parent registration.
  - `POST /api/v1/auth/login`: Login & issue JWT tokens.
  - `POST /api/v1/auth/refresh`: Rotate access token.
  - `POST /api/v1/auth/otp/send`: Request OTP.
  - `POST /api/v1/auth/otp/verify`: Verify OTP.
- **Parent Profile**:
  - `GET /api/v1/parents/me`: Get profile.
  - `PATCH /api/v1/parents/me`: Update profile settings.
- **Children**:
  - `POST /api/v1/children`: Create child profile.
  - `GET /api/v1/children`: List children.
  - `GET /api/v1/children/:childId`: Get child details.
  - `PATCH /api/v1/children/:childId`: Update child details.
- **Memories**:
  - `POST /api/v1/memories`: Log family memory or bedtime context.
  - `GET /api/v1/memories`: Query memories (with optional `childId` filter).
  - `DELETE /api/v1/memories/:memoryId`: Remove memory.
- **Voice Profiles**:
  - `POST /api/v1/voices`: Register new voice profile.
  - `POST /api/v1/voices/upload-url`: Request presigned S3 upload URL for recording audio.
  - `POST /api/v1/voices/:voiceId/clone`: Initiate voice cloning via generic AI service.
  - `GET /api/v1/voices`: List user's voice profiles.
  - `GET /api/v1/voices/:voiceId`: Voice profile details.
- **Stories & Playback**:
  - `POST /api/v1/stories`: Create bedtime story request (triggers AI pipeline).
  - `GET /api/v1/stories`: List stories (filter by child or status).
  - `GET /api/v1/stories/:storyId`: Story details & status.
  - `POST /api/v1/stories/:storyId/playback`: Update playback progress / resume session.
  - `GET /api/v1/stories/:storyId/playback`: Get current playback state.

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
