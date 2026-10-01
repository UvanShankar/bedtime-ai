import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { QueuesStack } from './queues-stack';

export interface SecurityStackProps extends cdk.StackProps {
  environmentName?: string;
  databaseStack: DatabaseStack;
  storageStack: StorageStack;
  queuesStack: QueuesStack;
}

export class SecurityStack extends cdk.Stack {
  public readonly nilaServiceRole: iam.Role;
  public readonly aiServiceRole: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    const env = props.environmentName || 'prod';

    // 1. IAM Role for Nila Core Service (Assumed by Lambda & ECS)
    this.nilaServiceRole = new iam.Role(this, 'NilaCoreServiceRole', {
      roleName: `nila-core-service-role-${env}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
      ),
      description: 'IAM execution role for Nila Core Backend Service',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions to Nila Core Service
    props.databaseStack.usersTable.grantReadWriteData(this.nilaServiceRole);
    props.databaseStack.otpTable.grantReadWriteData(this.nilaServiceRole);
    props.databaseStack.childrenTable.grantReadWriteData(this.nilaServiceRole);
    props.databaseStack.memoriesTable.grantReadWriteData(this.nilaServiceRole);
    props.databaseStack.voiceProfilesTable.grantReadWriteData(this.nilaServiceRole);
    props.databaseStack.storiesTable.grantReadWriteData(this.nilaServiceRole);
    props.databaseStack.playbackSessionsTable.grantReadWriteData(this.nilaServiceRole);

    // Grant S3 access to Nila Core Service
    props.storageStack.uploadsBucket.grantReadWrite(this.nilaServiceRole);
    props.storageStack.storyAudioBucket.grantRead(this.nilaServiceRole);

    // Grant SQS queue access to Nila Core Service
    props.queuesStack.storyGenerationQueue.grantSendMessages(this.nilaServiceRole);
    props.queuesStack.voiceCloningQueue.grantSendMessages(this.nilaServiceRole);

    // 2. IAM Role for Generic AI Service (Assumed by Lambda & ECS)
    this.aiServiceRole = new iam.Role(this, 'NilaGenericAIServiceRole', {
      roleName: `nila-generic-ai-service-role-${env}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
      ),
      description: 'IAM execution role for Generic AI Platform Service',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions to Generic AI Service
    props.databaseStack.aiJobsTable.grantReadWriteData(this.aiServiceRole);
    props.databaseStack.aiVoiceRegistryTable.grantReadWriteData(this.aiServiceRole);
    // AI Service also updates Story status and Audio S3 key directly when processing pipeline
    props.databaseStack.storiesTable.grantReadWriteData(this.aiServiceRole);
    props.databaseStack.voiceProfilesTable.grantReadWriteData(this.aiServiceRole);

    // Grant S3 access to Generic AI Service
    props.storageStack.uploadsBucket.grantRead(this.aiServiceRole);
    props.storageStack.storyAudioBucket.grantReadWrite(this.aiServiceRole);
    props.storageStack.aiSpeechBucket.grantReadWrite(this.aiServiceRole);

    // Grant SQS queue consumption
    props.queuesStack.storyGenerationQueue.grantConsumeMessages(this.aiServiceRole);
    props.queuesStack.voiceCloningQueue.grantConsumeMessages(this.aiServiceRole);
    props.queuesStack.aiTaskQueue.grantConsumeMessages(this.aiServiceRole);

    // 4. Export SSM Parameters for Service Configuration
    new ssm.StringParameter(this, 'CloudFrontUrlParam', {
      parameterName: `/nila/${env}/cdn-url`,
      stringValue: `https://${props.storageStack.distribution.distributionDomainName}`,
    });

    new ssm.StringParameter(this, 'StoryQueueUrlParam', {
      parameterName: `/nila/${env}/story-queue-url`,
      stringValue: props.queuesStack.storyGenerationQueue.queueUrl,
    });
  }
}
