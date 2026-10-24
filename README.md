# Nila Bedtime Stories — Backend & Infrastructure

Full-stack production architecture for Nila Bedtime Stories application, following the `PurpleOneService` design pattern with a clean separation of concerns:

- `generic-ai-service/`: Standalone, reusable AI platform for LLM story synthesis, voice cloning, and text-to-speech (TTS).
- `nila-core-service/`: Domain backend for Nila (User Authentication, Child Profiles, Memories, Stories, Voice Profiles, Playback Sessions).
- `infra-cdk/`: AWS CDK package provisioning multi-table DynamoDB, S3, SQS, CloudFront, ECS Fargate, and ALB.

## Directory Structure

```
D:\bedtime-ai\
├── generic-ai-service/        # Standalone AI microservice (Express + TypeScript)
│   ├── src/
│   │   ├── controller/        # Text, Speech, Voice, Job Controllers
│   │   ├── dao/               # DynamoDB Data Access Objects
│   │   ├── database/          # AWS DynamoDB & S3 SDK clients
│   │   ├── exceptions/        # ApiError & PurpleOne standard envelope
│   │   ├── middleware/        # API key verification
│   │   ├── models/            # AIJob, AIVoiceRegistry
│   │   ├── providers/         # Gemini, ElevenLabs, Mock Providers
│   │   ├── routes/            # Express routers
│   │   ├── services/          # LLM, TTS, VoiceClone, JobExecution
│   │   ├── app.ts & server.ts
│   │   └── types.ts
│   ├── Dockerfile
│   └── package.json
│
├── nila-core-service/         # Nila Core Domain Backend (Express + TypeScript)
│   ├── src/
│   │   ├── controller/        # Auth, Parent, Child, Memory, Voice, Story
│   │   ├── dao/               # DynamoDB DAOs
│   │   ├── database/          # DynamoDB & S3 operations
│   │   ├── exceptions/        # PurpleOne standard envelope & ApiError
│   │   ├── middleware/        # JWT Authentication
│   │   ├── models/            # User, Child, Memory, Story, Voice, Playback
│   │   ├── routes/            # Domain REST routes
│   │   ├── services/          # Business logic & AIServiceClient
│   │   ├── app.ts & server.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── Dockerfile
│   └── package.json
│
└── infra-cdk/                 # AWS CDK CloudFormation Stack
    ├── bin/infra.ts
    ├── lib/
    │   ├── database-stack.ts  # 9 DynamoDB tables (Multi-table design)
    │   ├── storage-stack.ts   # S3 buckets & CloudFront CDN
    │   ├── queues-stack.ts    # SQS FIFO & standard queues + DLQs
    │   ├── security-stack.ts  # KMS Keys, IAM Roles, SSM Parameters
    │   └── compute-stack.ts   # VPC, ECS Fargate, ALB Routing
    └── package.json
```

## Quick Start

### 1. Build and Run Generic AI Service
```bash
cd generic-ai-service
npm install
cp .env.example .env # Configure GROQ_API_KEY
npm run build
npm run start
```

#### Test Story Generation Pipeline
```bash
# Run Preset 1 (Bramble the Hedgehog, Age 5)
npm run story 1

# Run Preset 5 (Spoken Tamil Bedtime, Age 5)
npm run story 5
```
See [`generic-ai-service/README.md`](generic-ai-service/README.md) for full setup, API key guides, and benchmarking instructions.

### 2. Build and Run Nila Core Service
```bash
cd nila-core-service
npm install
npm run build
npm run dev
```

### 3. Deploy to AWS via CDK
```bash
cd infra-cdk
npm install
npm run build
npx cdk synth
npx cdk deploy --all
```
