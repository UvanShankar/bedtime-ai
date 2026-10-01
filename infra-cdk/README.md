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
   - IAM least-privilege roles for AWS Lambda and ECS execution with AWS-managed encryption ($0.00 base cost).
   - SSM parameter store exports for dynamic endpoint discovery.
5. **`ComputeStack` (Serverless — $0.00 Idle Bill)**:
   - AWS Lambda Container Functions running with official AWS Lambda Web Adapter.
   - HTTP API Gateway (v2) with intelligent path routing:
     - `/api/v1/ai/*` -> `generic-ai-service` Lambda
     - All other paths -> `nila-core-service` Lambda
   - **Cost at 0 traffic: $0.00 / month** (no NAT Gateway, no ALB, no 24/7 VMs).

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
