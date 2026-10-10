import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { QueuesStack } from './queues-stack';

export interface ComputeStackProps extends cdk.StackProps {
  environmentName?: string;
  securityStack: SecurityStack;
  databaseStack: DatabaseStack;
  storageStack: StorageStack;
  queuesStack: QueuesStack;
}

export class ComputeStack extends cdk.Stack {
  public readonly nilaFunction: lambda.DockerImageFunction;
  public readonly aiFunction: lambda.DockerImageFunction;
  public readonly httpApi: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const env = props.environmentName || 'prod';

    // 1. Generic AI Service Lambda (Serverless Container)
    // Generous 120s timeout and 2048 MB RAM for LLM / TTS / Voice processing
    this.aiFunction = new lambda.DockerImageFunction(this, 'NilaGenericAIFunction', {
      functionName: `nila-generic-ai-service-${env}`,
      code: lambda.DockerImageCode.fromImageAsset('../generic-ai-service'),
      architecture: lambda.Architecture.X86_64,
      memorySize: 2048,
      timeout: cdk.Duration.seconds(120),
      role: props.securityStack.aiServiceRole,
      environment: {
        NODE_ENV: env,
        PORT: '8082',
        AWS_LWA_PORT: '8082',
        AI_SPEECH_BUCKET: props.storageStack.aiSpeechBucket.bucketName,
        STORY_AUDIO_BUCKET: props.storageStack.storyAudioBucket.bucketName,
        UPLOADS_BUCKET: props.storageStack.uploadsBucket.bucketName,
        MEDIA_UPLOADS_BUCKET: props.storageStack.uploadsBucket.bucketName,
        STORY_QUEUE_URL: props.queuesStack.storyGenerationQueue.queueUrl,
        DYNAMODB_AI_JOBS_TABLE: props.databaseStack.aiJobsTable.tableName,
        DYNAMODB_VOICE_REGISTRY_TABLE: props.databaseStack.aiVoiceRegistryTable.tableName,
        AI_SERVICE_API_KEY: process.env.AI_SERVICE_API_KEY || 'test-ai-key-secret-12345',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        SARVAM_API_KEY: process.env.SARVAM_API_KEY || '',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
        ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
      },
      description: 'Generic AI Service - ChatGPT wrapper, TTS, and Voice Cloning ($0.00 idle cost)',
    });

    // 2. Nila Core Service Lambda (Serverless Container)
    this.nilaFunction = new lambda.DockerImageFunction(this, 'NilaCoreFunction', {
      functionName: `nila-core-service-${env}`,
      code: lambda.DockerImageCode.fromImageAsset('../nila-core-service'),
      architecture: lambda.Architecture.X86_64,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(120),
      role: props.securityStack.nilaServiceRole,
      environment: {
        NODE_ENV: env,
        PORT: '8080',
        AWS_LWA_PORT: '8080',
        CDN_URL: `https://${props.storageStack.distribution.distributionDomainName}`,
        UPLOADS_BUCKET: props.storageStack.uploadsBucket.bucketName,
        STORY_AUDIO_BUCKET: props.storageStack.storyAudioBucket.bucketName,
        STORY_QUEUE_URL: props.queuesStack.storyGenerationQueue.queueUrl,
        DYNAMODB_USERS_TABLE: props.databaseStack.usersTable.tableName,
        DYNAMODB_OTP_TABLE: props.databaseStack.otpTable.tableName,
        DYNAMODB_CHILDREN_TABLE: props.databaseStack.childrenTable.tableName,
        DYNAMODB_MEMORIES_TABLE: props.databaseStack.memoriesTable.tableName,
        DYNAMODB_VOICE_PROFILES_TABLE: props.databaseStack.voiceProfilesTable.tableName,
        DYNAMODB_STORIES_TABLE: props.databaseStack.storiesTable.tableName,
        DYNAMODB_PLAYBACK_SESSIONS_TABLE: props.databaseStack.playbackSessionsTable.tableName,
        AI_SERVICE_API_KEY: process.env.AI_SERVICE_API_KEY || 'test-ai-key-secret-12345',
        JWT_SECRET: process.env.JWT_SECRET || 'nila-jwt-super-secret-key-prod',
      },
      description: 'Nila Core Backend Service - Domain APIs, Auth, Children, Stories ($0.00 idle cost)',
    });

    // 3. Serverless HTTP API Gateway (v2) - $0.00 base cost at 0 traffic
    this.httpApi = new apigwv2.HttpApi(this, 'NilaHttpApi', {
      apiName: `nila-api-${env}`,
      description: 'Serverless HTTP API Gateway for Nila Bedtime Stories ($0.00 at 0 traffic)',
      corsPreflight: {
        allowHeaders: ['*'],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowOrigins: ['*'],
      },
    });

    const aiIntegration = new HttpLambdaIntegration('NilaGenericAIIntegration', this.aiFunction);
    const nilaIntegration = new HttpLambdaIntegration('NilaCoreIntegration', this.nilaFunction);

    // Route /api/v1/ai and /api/v1/ai/{proxy+} to Generic AI Service Lambda
    this.httpApi.addRoutes({
      path: '/api/v1/ai',
      methods: [apigwv2.HttpMethod.ANY],
      integration: aiIntegration,
    });
    this.httpApi.addRoutes({
      path: '/api/v1/ai/{proxy+}',
      methods: [apigwv2.HttpMethod.ANY],
      integration: aiIntegration,
    });

    // Route all other requests (and root) to Nila Core Service Lambda
    this.httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigwv2.HttpMethod.ANY],
      integration: nilaIntegration,
    });
    this.httpApi.addRoutes({
      path: '/',
      methods: [apigwv2.HttpMethod.ANY],
      integration: nilaIntegration,
    });

    // Point Nila Core's AI_SERVICE_URL to the API Gateway endpoint
    this.nilaFunction.addEnvironment('AI_SERVICE_URL', this.httpApi.apiEndpoint);

    // 4. Output the Serverless Public Endpoint
    new cdk.CfnOutput(this, 'HttpApiEndpoint', {
      value: this.httpApi.apiEndpoint,
      description: 'Serverless HTTP API Gateway URL ($0.00 at 0 traffic)',
      exportName: `NilaApiEndpoint-${env}`,
    });
  }
}
