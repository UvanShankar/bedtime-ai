#!/usr/bin/env bash
set -e

ENDPOINT_URL=${AWS_ENDPOINT_URL:-http://localhost:4566}
REGION=${AWS_REGION:-ap-south-1}

echo "=========================================================="
echo "Initializing AWS LocalStack Resources (DynamoDB, S3, SQS)"
echo "Target Endpoint: $ENDPOINT_URL"
echo "Region: $REGION"
echo "=========================================================="

export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=$REGION

# Helper for AWS / awslocal calls
if command -v awslocal >/dev/null 2>&1; then
  awscmd() {
    awslocal "$@"
  }
else
  awscmd() {
    aws --endpoint-url="$ENDPOINT_URL" --region "$REGION" "$@"
  }
fi

echo "1. Creating S3 Buckets..."
awscmd s3 mb s3://nila-media-uploads-dev 2>/dev/null || true
awscmd s3 mb s3://nila-story-audio-dev 2>/dev/null || true
awscmd s3 mb s3://nila-ai-speech-output-dev 2>/dev/null || true
echo "   S3 Buckets created."

echo "2. Creating SQS Queues..."
awscmd sqs create-queue --queue-name nila-story-generation-dlq-dev.fifo --attributes FifoQueue=true 2>/dev/null || true
awscmd sqs create-queue --queue-name nila-story-generation-queue-dev.fifo --attributes FifoQueue=true,ContentBasedDeduplication=true 2>/dev/null || true
awscmd sqs create-queue --queue-name nila-voice-cloning-dlq-dev 2>/dev/null || true
awscmd sqs create-queue --queue-name nila-voice-cloning-queue-dev 2>/dev/null || true
awscmd sqs create-queue --queue-name nila-generic-ai-tasks-dlq-dev 2>/dev/null || true
awscmd sqs create-queue --queue-name nila-generic-ai-tasks-queue-dev 2>/dev/null || true
echo "   SQS Queues created."

echo "3. Creating DynamoDB Tables..."

# 1. Users Table
awscmd dynamodb create-table \
  --table-name Nila_Users_dev \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=mobile,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {\"IndexName\": \"mobile-index\", \"KeySchema\": [{\"AttributeName\": \"mobile\", \"KeyType\": \"HASH\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}},
      {\"IndexName\": \"email-index\", \"KeySchema\": [{\"AttributeName\": \"email\", \"KeyType\": \"HASH\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST 2>/dev/null || true

# 2. OTP Table
awscmd dynamodb create-table \
  --table-name Nila_Otp_dev \
  --attribute-definitions AttributeName=target,AttributeType=S \
  --key-schema AttributeName=target,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST 2>/dev/null || true

# 3. Children Table
awscmd dynamodb create-table \
  --table-name Nila_Children_dev \
  --attribute-definitions \
    AttributeName=childId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=childId,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {\"IndexName\": \"userId-createdAt-index\", \"KeySchema\": [{\"AttributeName\": \"userId\", \"KeyType\": \"HASH\"}, {\"AttributeName\": \"createdAt\", \"KeyType\": \"RANGE\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST 2>/dev/null || true

# 4. Memories Table
awscmd dynamodb create-table \
  --table-name Nila_Memories_dev \
  --attribute-definitions \
    AttributeName=memoryId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=childId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=memoryId,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {\"IndexName\": \"userId-createdAt-index\", \"KeySchema\": [{\"AttributeName\": \"userId\", \"KeyType\": \"HASH\"}, {\"AttributeName\": \"createdAt\", \"KeyType\": \"RANGE\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}},
      {\"IndexName\": \"childId-createdAt-index\", \"KeySchema\": [{\"AttributeName\": \"childId\", \"KeyType\": \"HASH\"}, {\"AttributeName\": \"createdAt\", \"KeyType\": \"RANGE\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST 2>/dev/null || true

# 5. Voice Profiles Table
awscmd dynamodb create-table \
  --table-name Nila_VoiceProfiles_dev \
  --attribute-definitions \
    AttributeName=voiceId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=voiceId,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {\"IndexName\": \"userId-createdAt-index\", \"KeySchema\": [{\"AttributeName\": \"userId\", \"KeyType\": \"HASH\"}, {\"AttributeName\": \"createdAt\", \"KeyType\": \"RANGE\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST 2>/dev/null || true

# 6. Stories Table
awscmd dynamodb create-table \
  --table-name Nila_Stories_dev \
  --attribute-definitions \
    AttributeName=storyId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=childId,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=storyId,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {\"IndexName\": \"userId-createdAt-index\", \"KeySchema\": [{\"AttributeName\": \"userId\", \"KeyType\": \"HASH\"}, {\"AttributeName\": \"createdAt\", \"KeyType\": \"RANGE\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}},
      {\"IndexName\": \"childId-createdAt-index\", \"KeySchema\": [{\"AttributeName\": \"childId\", \"KeyType\": \"HASH\"}, {\"AttributeName\": \"createdAt\", \"KeyType\": \"RANGE\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}},
      {\"IndexName\": \"status-createdAt-index\", \"KeySchema\": [{\"AttributeName\": \"status\", \"KeyType\": \"HASH\"}, {\"AttributeName\": \"createdAt\", \"KeyType\": \"RANGE\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST 2>/dev/null || true

# 7. Playback Sessions Table
awscmd dynamodb create-table \
  --table-name Nila_PlaybackSessions_dev \
  --attribute-definitions \
    AttributeName=sessionId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=updatedAt,AttributeType=S \
    AttributeName=storyId,AttributeType=S \
  --key-schema AttributeName=sessionId,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {\"IndexName\": \"userId-updatedAt-index\", \"KeySchema\": [{\"AttributeName\": \"userId\", \"KeyType\": \"HASH\"}, {\"AttributeName\": \"updatedAt\", \"KeyType\": \"RANGE\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}},
      {\"IndexName\": \"storyId-index\", \"KeySchema\": [{\"AttributeName\": \"storyId\", \"KeyType\": \"HASH\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST 2>/dev/null || true

# 8. AI Voice Registry Table
awscmd dynamodb create-table \
  --table-name Nila_AI_VoiceRegistry_dev \
  --attribute-definitions \
    AttributeName=aiVoiceId,AttributeType=S \
    AttributeName=ownerProject,AttributeType=S \
    AttributeName=externalReferenceId,AttributeType=S \
  --key-schema AttributeName=aiVoiceId,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {\"IndexName\": \"ownerProject-externalRef-index\", \"KeySchema\": [{\"AttributeName\": \"ownerProject\", \"KeyType\": \"HASH\"}, {\"AttributeName\": \"externalReferenceId\", \"KeyType\": \"RANGE\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST 2>/dev/null || true

# 9. AI Jobs Table
awscmd dynamodb create-table \
  --table-name Nila_AI_Jobs_dev \
  --attribute-definitions \
    AttributeName=jobId,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=jobId,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {\"IndexName\": \"status-createdAt-index\", \"KeySchema\": [{\"AttributeName\": \"status\", \"KeyType\": \"HASH\"}, {\"AttributeName\": \"createdAt\", \"KeyType\": \"RANGE\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}}
    ]" \
  --billing-mode PAY_PER_REQUEST 2>/dev/null || true

echo "   All 9 DynamoDB Tables successfully created in LocalStack!"
echo "=========================================================="
echo "LocalStack AWS Infrastructure is Ready!"
echo "=========================================================="
