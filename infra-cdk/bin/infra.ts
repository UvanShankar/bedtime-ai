#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';
import { QueuesStack } from '../lib/queues-stack';
import { SecurityStack } from '../lib/security-stack';
import { ComputeStack } from '../lib/compute-stack';

const app = new cdk.App();

const environmentName = app.node.tryGetContext('env') || 'prod';

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'ap-south-1',
};

// 1. Multi-Table DynamoDB Database Stack
const databaseStack = new DatabaseStack(app, `NilaDatabaseStack-${environmentName}`, {
  env,
  environmentName,
  description: 'Multi-table DynamoDB database stack for Nila and Generic AI Service',
});

// 2. S3 Media & CloudFront CDN Storage Stack
const storageStack = new StorageStack(app, `NilaStorageStack-${environmentName}`, {
  env,
  environmentName,
  description: 'S3 buckets and CloudFront CDN storage stack',
});

// 3. SQS & DLQ Asynchronous Pipelines Stack
const queuesStack = new QueuesStack(app, `NilaQueuesStack-${environmentName}`, {
  env,
  environmentName,
  description: 'SQS queues and DLQs for async story generation and voice cloning',
});

// 4. IAM Roles & KMS Security Stack
const securityStack = new SecurityStack(app, `NilaSecurityStack-${environmentName}`, {
  env,
  environmentName,
  databaseStack,
  storageStack,
  queuesStack,
  description: 'IAM execution roles, KMS keys, and security parameters',
});

// 5. ECS Fargate & ALB Compute Stack
new ComputeStack(app, `NilaComputeStack-${environmentName}`, {
  env,
  environmentName,
  securityStack,
  databaseStack,
  storageStack,
  queuesStack,
  description: 'ECS Fargate container services and Application Load Balancer',
});

app.synth();
