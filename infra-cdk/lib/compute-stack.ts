import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
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
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const env = props.environmentName || 'prod';

    // 1. VPC across 2 Availability Zones
    this.vpc = new ec2.Vpc(this, 'NilaVpc', {
      vpcName: `nila-vpc-${env}`,
      maxAzs: 2,
      natGateways: 1, // Single NAT Gateway for cost-efficiency in dev/prod
    });

    // 2. ECS Fargate Cluster
    this.cluster = new ecs.Cluster(this, 'NilaCluster', {
      clusterName: `nila-ecs-cluster-${env}`,
      vpc: this.vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    // 3. Shared Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'NilaALB', {
      loadBalancerName: `nila-alb-${env}`,
      vpc: this.vpc,
      internetFacing: true,
    });

    const httpListener = this.alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    // 4. Nila Core Service (Fargate Task)
    const nilaTaskDef = new ecs.FargateTaskDefinition(this, 'NilaCoreTaskDef', {
      family: `nila-core-task-${env}`,
      taskRole: props.securityStack.nilaServiceRole,
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    const nilaContainer = nilaTaskDef.addContainer('NilaCoreContainer', {
      image: ecs.ContainerImage.fromAsset('../nila-core-service'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'nila-core' }),
      environment: {
        NODE_ENV: env,
        PORT: '8080',
        CDN_URL: `https://${props.storageStack.distribution.distributionDomainName}`,
        UPLOADS_BUCKET: props.storageStack.uploadsBucket.bucketName,
        STORY_AUDIO_BUCKET: props.storageStack.storyAudioBucket.bucketName,
        STORY_QUEUE_URL: props.queuesStack.storyGenerationQueue.queueUrl,
        AI_SERVICE_URL: 'http://localhost:8081',
      },
    });
    nilaContainer.addPortMappings({ containerPort: 8080 });

    const nilaFargateService = new ecs.FargateService(this, 'NilaCoreFargateService', {
      cluster: this.cluster,
      taskDefinition: nilaTaskDef,
      desiredCount: 1,
      serviceName: `nila-core-service-${env}`,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // 5. Generic AI Service (Fargate Task)
    const aiTaskDef = new ecs.FargateTaskDefinition(this, 'GenericAITaskDef', {
      family: `generic-ai-task-${env}`,
      taskRole: props.securityStack.aiServiceRole,
      cpu: 1024,
      memoryLimitMiB: 2048,
    });

    const aiContainer = aiTaskDef.addContainer('GenericAIContainer', {
      image: ecs.ContainerImage.fromAsset('../generic-ai-service'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'generic-ai' }),
      environment: {
        NODE_ENV: env,
        PORT: '8081',
        AI_SPEECH_BUCKET: props.storageStack.aiSpeechBucket.bucketName,
        STORY_AUDIO_BUCKET: props.storageStack.storyAudioBucket.bucketName,
        STORY_QUEUE_URL: props.queuesStack.storyGenerationQueue.queueUrl,
      },
    });
    aiContainer.addPortMappings({ containerPort: 8081 });

    const aiFargateService = new ecs.FargateService(this, 'GenericAIFargateService', {
      cluster: this.cluster,
      taskDefinition: aiTaskDef,
      desiredCount: 1,
      serviceName: `generic-ai-service-${env}`,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // 6. ALB Routing:
    // Route /api/v1/ai/* to Generic AI Service
    // Route all other requests to Nila Core Service
    const aiTargetGroup = new elbv2.ApplicationTargetGroup(this, 'AITargetGroup', {
      vpc: this.vpc,
      port: 8081,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [aiFargateService],
      healthCheck: {
        path: '/healthy',
        interval: cdk.Duration.seconds(30),
      },
    });

    const nilaTargetGroup = new elbv2.ApplicationTargetGroup(this, 'NilaTargetGroup', {
      vpc: this.vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [nilaFargateService],
      healthCheck: {
        path: '/healthy',
        interval: cdk.Duration.seconds(30),
      },
    });

    // Default action -> Nila Core
    httpListener.addAction('DefaultAction', {
      action: elbv2.ListenerAction.forward([nilaTargetGroup]),
    });

    // Rule: /api/v1/ai/* -> Generic AI Service
    httpListener.addAction('AIRouteAction', {
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/v1/ai*'])],
      action: elbv2.ListenerAction.forward([aiTargetGroup]),
    });

    // 7. Auto-scaling (CPU > 70%)
    nilaFargateService.autoScaleTaskCount({ minCapacity: 1, maxCapacity: 10 })
      .scaleOnCpuUtilization('NilaCpuScaling', { targetUtilizationPercent: 70 });

    aiFargateService.autoScaleTaskCount({ minCapacity: 1, maxCapacity: 10 })
      .scaleOnCpuUtilization('AICpuScaling', { targetUtilizationPercent: 70 });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.alb.loadBalancerDnsName,
      description: 'Public Application Load Balancer endpoint',
    });
  }
}
