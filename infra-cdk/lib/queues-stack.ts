import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface QueuesStackProps extends cdk.StackProps {
  environmentName?: string;
}

export class QueuesStack extends cdk.Stack {
  public readonly storyGenerationQueue: sqs.Queue;
  public readonly storyGenerationDLQ: sqs.Queue;
  public readonly voiceCloningQueue: sqs.Queue;
  public readonly voiceCloningDLQ: sqs.Queue;
  public readonly aiTaskQueue: sqs.Queue;
  public readonly aiTaskDLQ: sqs.Queue;

  constructor(scope: Construct, id: string, props?: QueuesStackProps) {
    super(scope, id, props);

    const env = props?.environmentName || 'prod';

    // 1. Story Generation DLQ & Main Queue
    this.storyGenerationDLQ = new sqs.Queue(this, 'StoryGenerationDLQ', {
      queueName: `nila-story-generation-dlq-${env}.fifo`,
      fifo: true,
      retentionPeriod: cdk.Duration.days(14),
    });

    this.storyGenerationQueue = new sqs.Queue(this, 'StoryGenerationQueue', {
      queueName: `nila-story-generation-queue-${env}.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: cdk.Duration.seconds(300), // 5 minutes for LLM + TTS pipeline
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: this.storyGenerationDLQ,
      },
    });

    // 2. Voice Cloning DLQ & Main Queue
    this.voiceCloningDLQ = new sqs.Queue(this, 'VoiceCloningDLQ', {
      queueName: `nila-voice-cloning-dlq-${env}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    this.voiceCloningQueue = new sqs.Queue(this, 'VoiceCloningQueue', {
      queueName: `nila-voice-cloning-queue-${env}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: this.voiceCloningDLQ,
      },
    });

    // 3. Generic AI Multi-Project Task DLQ & Main Queue
    this.aiTaskDLQ = new sqs.Queue(this, 'AITaskDLQ', {
      queueName: `generic-ai-tasks-dlq-${env}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    this.aiTaskQueue = new sqs.Queue(this, 'AITaskQueue', {
      queueName: `generic-ai-tasks-queue-${env}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: this.aiTaskDLQ,
      },
    });
  }
}
