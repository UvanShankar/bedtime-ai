import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ITokenPayload } from './types';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'nila_access_secret_123';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'nila_refresh_secret_456';

export function generateTokens(payload: ITokenPayload) {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any,
  });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRY || '30d') as any,
  });
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): ITokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as ITokenPayload;
}

export function verifyRefreshToken(token: string): ITokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as ITokenPayload;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plain, hash);
}

export function generateId(prefix: string): string {
  return `${prefix}_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
}
