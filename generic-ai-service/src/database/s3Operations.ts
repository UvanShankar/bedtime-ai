import dotenv from 'dotenv';
dotenv.config();

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = process.env.AWS_REGION || 'ap-south-1';
const isDebug = process.env.DEBUG === 'true';

const isLambda = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV);
const hasExplicitAwsCredentials = !isLambda && !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

export const s3Client = new S3Client({
  region,
  ...(hasExplicitAwsCredentials && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
    },
  }),
  ...(isDebug && {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:4566',
    forcePathStyle: true,
  }),
});

import fs from 'fs';
import path from 'path';
import logger from '../logger';

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
  logger.info(`ðŸ” [s3Operations] Resolving audio buffer for: "${urlOrKey}"`);

  // 1. If it's a local file URL or file path (e.g. http://localhost:.../uploads/... or uploads/...)
  if (urlOrKey.includes('/uploads/')) {
    const relativePath = urlOrKey.split('/uploads/')[1];
    const localPath = path.join(process.cwd(), 'uploads', relativePath);
    if (fs.existsSync(localPath)) {
      logger.debug(`ðŸ“‚ [s3Operations] Found local file: ${localPath}`);
      return fs.readFileSync(localPath);
    }
  }

  let bucket: string | undefined;
  let key: string | undefined;

  // 2. Parse S3 URLs or bare keys
  if (urlOrKey.startsWith('s3://')) {
    const s3Parts = urlOrKey.slice(5).split('/');
    bucket = s3Parts[0];
    key = s3Parts.slice(1).join('/');
  } else if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
    try {
      const parsedUrl = new URL(urlOrKey);
      const hostname = parsedUrl.hostname;
      const pathname = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''));

      // Pattern A: <bucket>.s3[.-]<region>?.amazonaws.com/<key> or <bucket>.s3.amazonaws.com/<key>
      const virtualHostMatch = hostname.match(/^([^.]+)\.s3(?:[.-][^.]+)?\.amazonaws\.com$/i);
      if (virtualHostMatch) {
        bucket = virtualHostMatch[1];
        key = pathname;
      }
      // Pattern B: s3[.-]<region>?.amazonaws.com/<bucket>/<key> or s3.amazonaws.com/<bucket>/<key>
      else if (/^s3(?:[.-][^.]+)?\.amazonaws\.com$/i.test(hostname)) {
        const parts = pathname.split('/');
        bucket = parts[0];
        key = parts.slice(1).join('/');
      }
    } catch (urlErr: any) {
      logger.warn(`âš ï¸ [s3Operations] URL parse warning for "${urlOrKey}": ${urlErr.message}`);
    }
  } else {
    // Bare key e.g. "uploads/voices/..." or "voice-samples/..."
    bucket =
      process.env.UPLOADS_BUCKET ||
      process.env.MEDIA_UPLOADS_BUCKET ||
      process.env.STORY_AUDIO_BUCKET ||
      process.env.AI_SPEECH_BUCKET ||
      'nila-media-uploads-prod-354953409985';
    key = urlOrKey;
  }

  // If identified as S3 object, fetch directly using S3 SDK with Lambda IAM execution credentials:
  if (bucket && key) {
    logger.info(`â˜ï¸ [s3Operations] Retrieving object via AWS S3 SDK: bucket="${bucket}", key="${key}"`);
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const res = await s3Client.send(command);
      const byteArray = await (res.Body as any)?.transformToByteArray();
      if (byteArray) {
        logger.info(`âœ… [s3Operations] Successfully loaded ${byteArray.length} bytes from S3 (bucket="${bucket}", key="${key}")`);
        return Buffer.from(byteArray);
      }
    } catch (s3Err: any) {
      logger.error(`âŒ [s3Operations] AWS S3 GetObject failed for bucket="${bucket}", key="${key}": ${s3Err.message}`);
      throw s3Err;
    }
  }

  // 3. Otherwise, fetch via HTTP (e.g. presigned S3 URL or external URL)
  logger.info(`ðŸŒ [s3Operations] Fetching audio via HTTP GET: ${urlOrKey}`);
  const response = await fetch(urlOrKey);
  if (!response.ok) {
    logger.error(`âŒ [s3Operations] HTTP audio fetch failed (${response.status} ${response.statusText}): ${urlOrKey}`);
    throw new Error(`Failed to fetch audio from URL: ${response.status} ${response.statusText}`);
  }
  const arrayBuf = await response.arrayBuffer();
  logger.info(`âœ… [s3Operations] Successfully downloaded ${arrayBuf.byteLength} bytes via HTTP from ${urlOrKey}`);
  return Buffer.from(arrayBuf);
}
