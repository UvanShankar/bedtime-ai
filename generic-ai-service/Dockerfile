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

# Include official AWS Lambda Web Adapter (enables zero-cost serverless execution on Lambda)
RUN mkdir -p /opt/extensions
COPY --from=public.ecr.aws/awslabs/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter
RUN chmod +x /opt/extensions/lambda-adapter

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 8082

CMD ["node", "dist/server.js"]
