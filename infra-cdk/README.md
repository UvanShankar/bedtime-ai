# Nila Bedtime AI Infrastructure (AWS CDK)

Comprehensive AWS CloudFormation infrastructure defined using AWS CDK TypeScript.

## Architecture & Stacks

1. **`DatabaseStack`**:
   - 9 independent DynamoDB tables with On-Demand billing (`PAY_PER_REQUEST`), Point-In-Time Recovery (PITR), and Global Secondary Indexes (GSIs).
   - No single-table design; each domain model has its own table.
2. **`StorageStack`**:
   - 3 S3 buckets (`uploads`, `story audio`, `ai speech output`).
   - CloudFront CDN distribution with Origin Access Control (OAC) for low-latency audio streaming.
3. **`QueuesStack`**:
   - SQS FIFO and Standard queues with Dead Letter Queues (DLQs) for resilient asynchronous story and voice processing.
4. **`SecurityStack`**:
   - AWS KMS customer managed key for encryption.
   - IAM least-privilege roles for ECS Fargate task roles.
   - SSM parameter store exports for dynamic endpoint discovery.
5. **`ComputeStack`**:
   - 2-AZ VPC with NAT Gateway.
   - ECS Fargate cluster running `nila-core-service` and `generic-ai-service`.
   - Shared Application Load Balancer with path-based routing:
     - `/api/v1/ai/*` -> `generic-ai-service`
     - All other paths -> `nila-core-service`

## CDK Commands

```bash
# Install dependencies
npm.cmd install

# Compile TypeScript
npm.cmd run build

# Synthesize CloudFormation templates
npx.cmd cdk synth

# Deploy all stacks to AWS
npx.cmd cdk deploy --all
```
