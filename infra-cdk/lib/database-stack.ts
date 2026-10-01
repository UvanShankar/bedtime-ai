import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  environmentName?: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;
  public readonly otpTable: dynamodb.Table;
  public readonly childrenTable: dynamodb.Table;
  public readonly memoriesTable: dynamodb.Table;
  public readonly voiceProfilesTable: dynamodb.Table;
  public readonly storiesTable: dynamodb.Table;
  public readonly playbackSessionsTable: dynamodb.Table;
  public readonly aiVoiceRegistryTable: dynamodb.Table;
  public readonly aiJobsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: DatabaseStackProps) {
    super(scope, id, props);

    const env = props?.environmentName || 'prod';
    const isProd = env === 'prod';
    const removalPolicy = isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

    // 1. Users Table (Parents / Accounts)
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `Nila_Users_${env}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    });
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'mobile-index',
      partitionKey: { name: 'mobile', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 2. OTP Table
    this.otpTable = new dynamodb.Table(this, 'OtpTable', {
      tableName: `Nila_Otp_${env}`,
      partitionKey: { name: 'target', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'expiresAt',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 3. Children Table (Child Profiles)
    this.childrenTable = new dynamodb.Table(this, 'ChildrenTable', {
      tableName: `Nila_Children_${env}`,
      partitionKey: { name: 'childId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    });
    this.childrenTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 4. Memories Table (Family Events & Context)
    this.memoriesTable = new dynamodb.Table(this, 'MemoriesTable', {
      tableName: `Nila_Memories_${env}`,
      partitionKey: { name: 'memoryId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    });
    this.memoriesTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    this.memoriesTable.addGlobalSecondaryIndex({
      indexName: 'childId-createdAt-index',
      partitionKey: { name: 'childId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 5. VoiceProfiles Table (Parent Cloned Voices)
    this.voiceProfilesTable = new dynamodb.Table(this, 'VoiceProfilesTable', {
      tableName: `Nila_VoiceProfiles_${env}`,
      partitionKey: { name: 'voiceId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    });
    this.voiceProfilesTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 6. Stories Table (Generated Bedtime Stories)
    this.storiesTable = new dynamodb.Table(this, 'StoriesTable', {
      tableName: `Nila_Stories_${env}`,
      partitionKey: { name: 'storyId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    });
    this.storiesTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    this.storiesTable.addGlobalSecondaryIndex({
      indexName: 'childId-createdAt-index',
      partitionKey: { name: 'childId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    this.storiesTable.addGlobalSecondaryIndex({
      indexName: 'status-createdAt-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 7. PlaybackSessions Table
    this.playbackSessionsTable = new dynamodb.Table(this, 'PlaybackSessionsTable', {
      tableName: `Nila_PlaybackSessions_${env}`,
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    });
    this.playbackSessionsTable.addGlobalSecondaryIndex({
      indexName: 'userId-updatedAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    this.playbackSessionsTable.addGlobalSecondaryIndex({
      indexName: 'storyId-index',
      partitionKey: { name: 'storyId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 8. Generic AI Service: AIVoiceRegistry Table (Cross-project voices)
    this.aiVoiceRegistryTable = new dynamodb.Table(this, 'NilaAIVoiceRegistryTable', {
      tableName: `Nila_AI_VoiceRegistry_${env}`,
      partitionKey: { name: 'aiVoiceId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    });
    this.aiVoiceRegistryTable.addGlobalSecondaryIndex({
      indexName: 'ownerProject-externalRef-index',
      partitionKey: { name: 'ownerProject', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'externalReferenceId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 9. Generic AI Service: AIJobs Table (Async LLM/TTS Jobs)
    this.aiJobsTable = new dynamodb.Table(this, 'NilaAIJobsTable', {
      tableName: `Nila_AI_Jobs_${env}`,
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'expiresAt',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    });
    this.aiJobsTable.addGlobalSecondaryIndex({
      indexName: 'status-createdAt-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
