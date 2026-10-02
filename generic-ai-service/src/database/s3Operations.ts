import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = process.env.AWS_REGION || 'ap-south-1';
const isDebug = process.env.DEBUG === 'true';

const hasExplicitAwsCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

export const s3Client = new S3Client({
  region,
  ...(hasExplicitAwsCredentials && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
  ...(isDebug && {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:4566',
    forcePathStyle: true,
  }),
});

import fs from 'fs';
import path from 'path';

export async function uploadBufferToS3(params: {
  Bucket: string;
  Key: string;
  Body: Buffer | Uint8Array;
  ContentType: string;
}): Promise<string> {
  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    return `https://${params.Bucket}.s3.${region}.amazonaws.com/${params.Key}`;
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production' && (error.name === 'CredentialsProviderError' || !process.env.AWS_ACCESS_KEY_ID)) {
      console.warn(`[s3Operations] AWS credentials unavailable in local development. Saving audio locally to uploads/${params.Key}`);
      const localDir = path.join(process.cwd(), 'uploads', path.dirname(params.Key));
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const localFilePath = path.join(process.cwd(), 'uploads', params.Key);
      fs.writeFileSync(localFilePath, Buffer.from(params.Body));
      const port = process.env.PORT || 8082;
      return `http://localhost:${port}/uploads/${params.Key}`;
    }
    throw error;
  }
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

export async function getPresignedUploadUrl(params: {
  Bucket: string;
  Key: string;
  ContentType?: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: params.Bucket,
    Key: params.Key,
    ContentType: params.ContentType || 'audio/wav',
  });
  return await getSignedUrl(s3Client, command, { expiresIn: params.expiresInSeconds || 3600 });
}

export async function getBufferFromUrlOrS3(urlOrKey: string): Promise<Buffer> {
  // 1. If it's a local file URL or file path (e.g. http://localhost:.../uploads/... or uploads/...)
  if (urlOrKey.includes('/uploads/')) {
    const relativePath = urlOrKey.split('/uploads/')[1];
    const localPath = path.join(process.cwd(), 'uploads', relativePath);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
  }

  // 2. If it's an S3 URL: https://<bucket>.s3.<region>.amazonaws.com/<key>
  const s3UrlMatch = urlOrKey.match(/^https:\/\/([^\.]+)\.s3[\.-]([^\.]+)\.amazonaws\.com\/(.+)$/);
  if (s3UrlMatch) {
    const bucket = s3UrlMatch[1];
    const key = decodeURIComponent(s3UrlMatch[3]);
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const res = await s3Client.send(command);
    const byteArray = await (res.Body as any)?.transformToByteArray();
    if (byteArray) return Buffer.from(byteArray);
  }

  // 3. If it's a bare S3 key: e.g. "voice-samples/nila/..."
  if (!urlOrKey.startsWith('http://') && !urlOrKey.startsWith('https://')) {
    const bucket =
      process.env.MEDIA_UPLOADS_BUCKET ||
      process.env.STORY_AUDIO_BUCKET ||
      process.env.AI_SPEECH_BUCKET ||
      'nila-media-uploads-prod-354953409985';
    const command = new GetObjectCommand({ Bucket: bucket, Key: urlOrKey });
    const res = await s3Client.send(command);
    const byteArray = await (res.Body as any)?.transformToByteArray();
    if (byteArray) return Buffer.from(byteArray);
  }

  // 4. Otherwise, fetch via HTTP (e.g. presigned S3 URL or external URL)
  const response = await fetch(urlOrKey);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio from URL: ${response.status} ${response.statusText}`);
  }
  const arrayBuf = await response.arrayBuffer();
  return Buffer.from(arrayBuf);
}
