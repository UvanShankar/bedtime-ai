import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.StackProps {
  environmentName?: string;
}

export class StorageStack extends cdk.Stack {
  public readonly uploadsBucket: s3.Bucket;
  public readonly storyAudioBucket: s3.Bucket;
  public readonly aiSpeechBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: StorageStackProps) {
    super(scope, id, props);

    const env = props?.environmentName || 'prod';
    const isProd = env === 'prod';
    const removalPolicy = isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

    // 1. Raw Uploads Bucket (Voice samples, Memory photos)
    this.uploadsBucket = new s3.Bucket(this, 'MediaUploadsBucket', {
      bucketName: `nila-media-uploads-${env}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy,
      autoDeleteObjects: !isProd,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'ExpireTempUploadsAfter30Days',
          prefix: 'temp/',
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // 2. Story Audio Output Bucket (Generated voice stories)
    this.storyAudioBucket = new s3.Bucket(this, 'StoryAudioBucket', {
      bucketName: `nila-story-audio-${env}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy,
      autoDeleteObjects: !isProd,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 86400,
        },
      ],
    });

    // 3. Generic AI Speech Bucket (Multi-project TTS & audio assets)
    this.aiSpeechBucket = new s3.Bucket(this, 'AISpeechBucket', {
      bucketName: `generic-ai-speech-output-${env}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy,
      autoDeleteObjects: !isProd,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // 4. CloudFront CDN Distribution for Story Audio streaming
    this.distribution = new cloudfront.Distribution(this, 'StoryCdnDistribution', {
      comment: `Nila Story Audio CDN (${env})`,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.storyAudioBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/uploads/*': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(this.uploadsBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'Public CDN domain for audio playback',
    });
  }
}
