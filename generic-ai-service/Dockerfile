# Multi-stage Dockerfile for Generic AI Service (Runs locally, in Docker, and on AWS Lambda)
FROM node:20-slim AS builder

WORKDIR /usr/src/app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src/ ./src/
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=8082
ENV AWS_LWA_PORT=8082
ENV AWS_LWA_READINESS_CHECK_PATH=/healthy

# Install ffmpeg for native audio transcoding (m4a/aac/mp3 -> 24kHz mono WAV)
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

# Include official AWS Lambda Web Adapter (enables zero-cost serverless execution on Lambda)
RUN mkdir -p /opt/extensions
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter
RUN chmod +x /opt/extensions/lambda-adapter

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 8082

CMD ["node", "dist/server.js"]
