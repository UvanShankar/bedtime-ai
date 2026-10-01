import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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

export async function uploadBufferToS3(params: {
  Bucket: string;
  Key: string;
  Body: Buffer | Uint8Array;
  ContentType: string;
}): Promise<string> {
  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  return `https://${params.Bucket}.s3.${region}.amazonaws.com/${params.Key}`;
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
