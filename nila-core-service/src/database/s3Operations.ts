import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = process.env.AWS_REGION || 'ap-south-1';
const isDebug = process.env.DEBUG === 'true';

export const s3Client = new S3Client({
  region,
  ...(isDebug && {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:4566',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
  }),
});

export async function getPresignedUploadUrl(params: {
  Bucket: string;
  Key: string;
  ContentType: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: params.Bucket,
    Key: params.Key,
    ContentType: params.ContentType,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: params.expiresInSeconds || 900 });
}

export async function getPresignedDownloadUrl(params: {
  Bucket: string;
  Key: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: params.Bucket,
    Key: params.Key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: params.expiresInSeconds || 3600 });
}
