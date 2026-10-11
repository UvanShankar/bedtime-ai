import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ScalarAttributeType,
  KeyType,
  BillingMode,
  ProjectionType,
} from '@aws-sdk/client-dynamodb';
import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { SQSClient, CreateQueueCommand } from '@aws-sdk/client-sqs';

const endpoint = process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566';
const region = process.env.AWS_REGION || 'ap-south-1';
const credentials = {
  accessKeyId: 'test',
  secretAccessKey: 'test',
};

const ddb = new DynamoDBClient({ endpoint, region, credentials });
const s3 = new S3Client({ endpoint, region, credentials, forcePathStyle: true });
const sqs = new SQSClient({ endpoint, region, credentials });

async function initS3() {
  const buckets = [
    'nila-media-uploads-dev',
    'nila-story-audio-dev',
    'nila-ai-speech-output-dev',
  ];

  console.log('🪣 Initializing S3 Buckets...');
  for (const bucket of buckets) {
    try {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`   ✅ S3 bucket created: ${bucket}`);
    } catch (err: any) {
      if (err.name === 'BucketAlreadyOwnedByYou' || err.name === 'BucketAlreadyExists') {
        console.log(`   ℹ️ S3 bucket exists: ${bucket}`);
      } else {
        console.warn(`   ⚠️ S3 bucket error (${bucket}): ${err.message}`);
      }
    }
  }
}

async function initSQS() {
  console.log('\n📬 Initializing SQS Queues...');
  const queues = [
    { QueueName: 'nila-story-generation-dlq-dev.fifo', Attributes: { FifoQueue: 'true' } },
    {
      QueueName: 'nila-story-generation-queue-dev.fifo',
      Attributes: { FifoQueue: 'true', ContentBasedDeduplication: 'true' },
    },
    { QueueName: 'nila-voice-cloning-dlq-dev' },
    { QueueName: 'nila-voice-cloning-queue-dev' },
    { QueueName: 'nila-generic-ai-tasks-dlq-dev' },
    { QueueName: 'nila-generic-ai-tasks-queue-dev' },
  ];

  for (const q of queues) {
    try {
      await sqs.send(new CreateQueueCommand(q));
      console.log(`   ✅ SQS queue created: ${q.QueueName}`);
    } catch (err: any) {
      if (err.name === 'QueueAlreadyExists') {
        console.log(`   ℹ️ SQS queue exists: ${q.QueueName}`);
      } else {
        console.warn(`   ⚠️ SQS queue error (${q.QueueName}): ${err.message}`);
      }
    }
  }
}

async function initDynamoDB() {
  console.log('\n📊 Initializing DynamoDB Tables...');
  const tables = [
    {
      TableName: 'Nila_Users_dev',
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' as KeyType }],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'mobile', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'email', AttributeType: 'S' as ScalarAttributeType },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'mobile-index',
          KeySchema: [{ AttributeName: 'mobile', KeyType: 'HASH' as KeyType }],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
        {
          IndexName: 'email-index',
          KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' as KeyType }],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST' as BillingMode,
    },
    {
      TableName: 'Nila_Otp_dev',
      KeySchema: [{ AttributeName: 'target', KeyType: 'HASH' as KeyType }],
      AttributeDefinitions: [{ AttributeName: 'target', AttributeType: 'S' as ScalarAttributeType }],
      BillingMode: 'PAY_PER_REQUEST' as BillingMode,
    },
    {
      TableName: 'Nila_Children_dev',
      KeySchema: [{ AttributeName: 'childId', KeyType: 'HASH' as KeyType }],
      AttributeDefinitions: [
        { AttributeName: 'childId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'userId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'createdAt', AttributeType: 'S' as ScalarAttributeType },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'userId-createdAt-index',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' as KeyType },
            { AttributeName: 'createdAt', KeyType: 'RANGE' as KeyType },
          ],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST' as BillingMode,
    },
    {
      TableName: 'Nila_Memories_dev',
      KeySchema: [{ AttributeName: 'memoryId', KeyType: 'HASH' as KeyType }],
      AttributeDefinitions: [
        { AttributeName: 'memoryId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'userId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'childId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'createdAt', AttributeType: 'S' as ScalarAttributeType },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'userId-createdAt-index',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' as KeyType },
            { AttributeName: 'createdAt', KeyType: 'RANGE' as KeyType },
          ],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
        {
          IndexName: 'childId-createdAt-index',
          KeySchema: [
            { AttributeName: 'childId', KeyType: 'HASH' as KeyType },
            { AttributeName: 'createdAt', KeyType: 'RANGE' as KeyType },
          ],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST' as BillingMode,
    },
    {
      TableName: 'Nila_VoiceProfiles_dev',
      KeySchema: [{ AttributeName: 'voiceId', KeyType: 'HASH' as KeyType }],
      AttributeDefinitions: [
        { AttributeName: 'voiceId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'userId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'createdAt', AttributeType: 'S' as ScalarAttributeType },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'userId-createdAt-index',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' as KeyType },
            { AttributeName: 'createdAt', KeyType: 'RANGE' as KeyType },
          ],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST' as BillingMode,
    },
    {
      TableName: 'Nila_Stories_dev',
      KeySchema: [{ AttributeName: 'storyId', KeyType: 'HASH' as KeyType }],
      AttributeDefinitions: [
        { AttributeName: 'storyId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'userId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'childId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'status', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'createdAt', AttributeType: 'S' as ScalarAttributeType },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'userId-createdAt-index',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' as KeyType },
            { AttributeName: 'createdAt', KeyType: 'RANGE' as KeyType },
          ],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
        {
          IndexName: 'childId-createdAt-index',
          KeySchema: [
            { AttributeName: 'childId', KeyType: 'HASH' as KeyType },
            { AttributeName: 'createdAt', KeyType: 'RANGE' as KeyType },
          ],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
        {
          IndexName: 'status-createdAt-index',
          KeySchema: [
            { AttributeName: 'status', KeyType: 'HASH' as KeyType },
            { AttributeName: 'createdAt', KeyType: 'RANGE' as KeyType },
          ],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST' as BillingMode,
    },
    {
      TableName: 'Nila_PlaybackSessions_dev',
      KeySchema: [{ AttributeName: 'sessionId', KeyType: 'HASH' as KeyType }],
      AttributeDefinitions: [
        { AttributeName: 'sessionId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'userId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'updatedAt', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'storyId', AttributeType: 'S' as ScalarAttributeType },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'userId-updatedAt-index',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' as KeyType },
            { AttributeName: 'updatedAt', KeyType: 'RANGE' as KeyType },
          ],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
        {
          IndexName: 'storyId-index',
          KeySchema: [{ AttributeName: 'storyId', KeyType: 'HASH' as KeyType }],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST' as BillingMode,
    },
    {
      TableName: 'Nila_AI_VoiceRegistry_dev',
      KeySchema: [{ AttributeName: 'aiVoiceId', KeyType: 'HASH' as KeyType }],
      AttributeDefinitions: [
        { AttributeName: 'aiVoiceId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'ownerProject', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'externalReferenceId', AttributeType: 'S' as ScalarAttributeType },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'ownerProject-externalRef-index',
          KeySchema: [
            { AttributeName: 'ownerProject', KeyType: 'HASH' as KeyType },
            { AttributeName: 'externalReferenceId', KeyType: 'RANGE' as KeyType },
          ],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST' as BillingMode,
    },
    {
      TableName: 'Nila_AI_Jobs_dev',
      KeySchema: [{ AttributeName: 'jobId', KeyType: 'HASH' as KeyType }],
      AttributeDefinitions: [
        { AttributeName: 'jobId', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'status', AttributeType: 'S' as ScalarAttributeType },
        { AttributeName: 'createdAt', AttributeType: 'S' as ScalarAttributeType },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'status-createdAt-index',
          KeySchema: [
            { AttributeName: 'status', KeyType: 'HASH' as KeyType },
            { AttributeName: 'createdAt', KeyType: 'RANGE' as KeyType },
          ],
          Projection: { ProjectionType: 'ALL' as ProjectionType },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST' as BillingMode,
    },
  ];

  for (const table of tables) {
    try {
      await ddb.send(new CreateTableCommand(table));
      console.log(`   ✅ DynamoDB table created: ${table.TableName}`);
    } catch (err: any) {
      if (err.name === 'ResourceInUseException') {
        console.log(`   ℹ️ DynamoDB table exists: ${table.TableName}`);
      } else {
        console.warn(`   ⚠️ DynamoDB table error (${table.TableName}): ${err.message}`);
      }
    }
  }
}

async function main() {
  console.log(`🚀 Connecting to LocalStack at: ${endpoint}`);
  await initS3();
  await initSQS();
  await initDynamoDB();
  console.log('\n🎉 Local AWS Emulation (DynamoDB + S3 + SQS) is 100% Ready!\n');
}

main().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
