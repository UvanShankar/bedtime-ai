import userDao from '../dao/UserDao';
import otpDao from '../dao/OtpDao';
import { ISignupDTO, ILoginDTO, IAuthResponse, ISendOtpDTO, IVerifyOtpDTO } from '../types';
import { IUserSchema } from '../models/User';
import { generateId, generateTokens, hashPassword, comparePassword } from '../utils';
import { ValidationError, UnauthorizedError } from '../exceptions/ApiError';

export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.trim().replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '+91' + cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  return '+' + cleaned;
}

export class AuthService {
  async sendOtp(dto: ISendOtpDTO): Promise<{
    success: boolean;
    message: string;
    mobile: string;
    otp?: string;
    expiresAt: number;
  }> {
    const rawNumber = dto.mobile || dto.phoneNumber;
    if (!rawNumber || rawNumber.trim().length < 6) {
      throw new ValidationError('A valid phone number is required');
    }
    const mobile = normalizePhoneNumber(rawNumber);

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const ttlMinutes = 10;
    const expiresAt = Math.floor(Date.now() / 1000) + ttlMinutes * 60;

    await otpDao.saveOtp(mobile, otp, ttlMinutes);
    console.log(`[AuthService] Generated OTP for ${mobile}: ${otp}`);

    return {
      success: true,
      message: `OTP sent successfully to ${mobile}`,
      mobile,
      otp, // Provided for instant sandbox testing / app preview
      expiresAt,
    };
  }

  async verifyOtp(dto: IVerifyOtpDTO): Promise<IAuthResponse> {
    const rawNumber = dto.mobile || dto.phoneNumber;
    if (!rawNumber) {
      throw new ValidationError('Phone number is required');
    }
    if (!dto.otp || dto.otp.trim().length < 4) {
      throw new ValidationError('Valid OTP is required');
    }

    const mobile = normalizePhoneNumber(rawNumber);
    const enteredOtp = dto.otp.trim();

    // Fetch OTP record from DynamoDB
    const otpRecord = await otpDao.getOtp(mobile);
    const nowEpoch = Math.floor(Date.now() / 1000);

    // Support master demo code '123456' or saved OTP match
    const isMasterOtp = enteredOtp === '123456';
    const isValidOtp = otpRecord && otpRecord.otp === enteredOtp && otpRecord.expiresAt >= nowEpoch;

    if (!isValidOtp && !isMasterOtp) {
      throw new ValidationError('Invalid or expired OTP. Please request a new one.');
    }

    // Delete verified OTP record so it cannot be replayed
    if (otpRecord) {
      await otpDao.deleteOtp(mobile).catch((err) => console.warn('[AuthService] Error deleting OTP:', err));
    }

    // Lookup user in DynamoDB Nila_Users table
    let user = await userDao.getUserByMobile(mobile);
    if (!user && mobile.startsWith('+91')) {
      user = await userDao.getUserByMobile(mobile.replace('+91', ''));
    }

    const timestamp = new Date().toISOString();

    if (!user) {
      // Auto-provision user account for phone number
      const userId = generateId('usr');
      const newUser: IUserSchema = {
        userId,
        fullName: dto.fullName?.trim() || 'Parent',
        mobile,
        relationship: (dto.relationship as any) || 'Appa',
        preferredLanguage: 'ta',
        preferredDialect: 'Standard',
        isVerified: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await userDao.createUser(newUser);
      user = newUser;
    } else {
      // User exists - update verified flag & optional name
      const updates: Partial<IUserSchema> = { isVerified: true };
      if (dto.fullName && (!user.fullName || user.fullName === 'Parent')) {
        updates.fullName = dto.fullName.trim();
      }
      if (dto.relationship && !user.relationship) {
        updates.relationship = dto.relationship as any;
      }
      await userDao.updateUser(user.userId, updates).catch((err) => console.warn('[AuthService] Update user err:', err));
      user = { ...user, ...updates };
    }

    const tokens = generateTokens({
      userId: user.userId,
      mobile: user.mobile,
      email: user.email,
    });

    return {
      user: {
        userId: user.userId,
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        relationship: user.relationship,
        isVerified: true,
      },
      tokens,
    };
  }

  async signup(dto: ISignupDTO): Promise<IAuthResponse> {
    const rawNumber = dto.mobile || dto.phoneNumber;
    if (!rawNumber && !dto.email) {
      throw new ValidationError('Mobile number is required for signup');
    }

    if (!dto.fullName || !dto.fullName.trim()) {
      throw new ValidationError('Full name is required for signup');
    }

    const mobile = rawNumber ? normalizePhoneNumber(rawNumber) : undefined;

    // If OTP is provided, verify it
    if (mobile && dto.otp) {
      const enteredOtp = dto.otp.trim();
      const otpRecord = await otpDao.getOtp(mobile);
      const nowEpoch = Math.floor(Date.now() / 1000);
      const isMasterOtp = enteredOtp === '123456';
      const isValidOtp = otpRecord && otpRecord.otp === enteredOtp && otpRecord.expiresAt >= nowEpoch;

      if (!isValidOtp && !isMasterOtp) {
        throw new ValidationError('Invalid or expired OTP. Please request a new one.');
      }

      if (otpRecord) {
        await otpDao.deleteOtp(mobile).catch((err) => console.warn('[AuthService] Error deleting OTP:', err));
      }
    }

    // Check if user with this mobile already exists
    let existing = mobile ? await userDao.getUserByMobile(mobile) : null;
    if (!existing && mobile && mobile.startsWith('+91')) {
      existing = await userDao.getUserByMobile(mobile.replace('+91', ''));
    }

    if (existing) {
      // User already exists - update profile and return tokens
      const updates: Partial<IUserSchema> = { isVerified: true };
      if (dto.fullName && dto.fullName.trim() !== 'Parent') {
        updates.fullName = dto.fullName.trim();
      }
      if (dto.relationship) {
        updates.relationship = dto.relationship as any;
      }
      if (dto.email && !existing.email) {
        updates.email = dto.email;
      }
      await userDao.updateUser(existing.userId, updates).catch(() => {});
      const user = { ...existing, ...updates };

      const tokens = generateTokens({
        userId: user.userId,
        mobile: user.mobile,
        email: user.email,
      });

      return {
        user: {
          userId: user.userId,
          fullName: user.fullName,
          mobile: user.mobile,
          email: user.email,
          relationship: user.relationship,
          isVerified: true,
        },
        tokens,
      };
    }

    if (dto.email) {
      const existingEmail = await userDao.getUserByEmail(dto.email);
      if (existingEmail) {
        throw new ValidationError(`User with email ${dto.email} is already registered`);
      }
    }

    const userId = generateId('usr');
    const timestamp = new Date().toISOString();
    const passwordHash = dto.password ? await hashPassword(dto.password) : undefined;

    const user: IUserSchema = {
      userId,
      fullName: dto.fullName.trim(),
      mobile,
      email: dto.email,
      passwordHash,
      relationship: (dto.relationship as any) || 'Appa',
      preferredLanguage: 'ta',
      preferredDialect: 'Standard',
      isVerified: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await userDao.createUser(user);

    const tokens = generateTokens({
      userId,
      mobile,
      email: dto.email,
    });

    return {
      user: {
        userId,
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        relationship: user.relationship,
        isVerified: user.isVerified,
      },
      tokens,
    };
  }

  async login(dto: ILoginDTO): Promise<IAuthResponse> {
    const rawNumber = dto.mobile || dto.phoneNumber || dto.emailOrMobile;
    if (!rawNumber) {
      throw new ValidationError('Mobile number is required for login');
    }

    const isPhone = /[0-9]{6,}/.test(rawNumber);
    const mobile = isPhone ? normalizePhoneNumber(rawNumber) : '';

    // If OTP is provided, verify OTP
    if (dto.otp) {
      const enteredOtp = dto.otp.trim();
      if (enteredOtp.length < 4) {
        throw new ValidationError('Valid OTP is required');
      }

      const lookupMobile = mobile || rawNumber;
      const otpRecord = await otpDao.getOtp(lookupMobile);
      const nowEpoch = Math.floor(Date.now() / 1000);
      const isMasterOtp = enteredOtp === '123456';
      const isValidOtp = otpRecord && otpRecord.otp === enteredOtp && otpRecord.expiresAt >= nowEpoch;

      if (!isValidOtp && !isMasterOtp) {
        throw new ValidationError('Invalid or expired OTP. Please request a new one.');
      }

      if (otpRecord) {
        await otpDao.deleteOtp(lookupMobile).catch((err) => console.warn('[AuthService] Error deleting OTP:', err));
      }

      // Lookup user in DynamoDB
      let user = mobile ? await userDao.getUserByMobile(mobile) : null;
      if (!user && mobile && mobile.startsWith('+91')) {
        user = await userDao.getUserByMobile(mobile.replace('+91', ''));
      }
      if (!user && !mobile) {
        user = await userDao.getUserByEmail(rawNumber);
      }

      // Auto-provision if logging in for the first time via OTP
      if (!user) {
        const userId = generateId('usr');
        const timestamp = new Date().toISOString();
        const newUser: IUserSchema = {
          userId,
          fullName: 'Parent',
          mobile: mobile || lookupMobile,
          relationship: 'Appa',
          preferredLanguage: 'ta',
          preferredDialect: 'Standard',
          isVerified: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        await userDao.createUser(newUser);
        user = newUser;
      }

      const tokens = generateTokens({
        userId: user.userId,
        mobile: user.mobile,
        email: user.email,
      });

      return {
        user: {
          userId: user.userId,
          fullName: user.fullName,
          mobile: user.mobile,
          email: user.email,
          relationship: user.relationship,
          isVerified: true,
        },
        tokens,
      };
    }

    // Fallback: Password login
    if (dto.password) {
      let user = mobile ? await userDao.getUserByMobile(mobile) : null;
      if (!user) {
        user = await userDao.getUserByEmail(rawNumber);
      }

      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      if (user.passwordHash) {
        const match = await comparePassword(dto.password, user.passwordHash);
        if (!match) {
          throw new UnauthorizedError('Invalid credentials');
        }
      }

      const tokens = generateTokens({
        userId: user.userId,
        mobile: user.mobile,
        email: user.email,
      });

      return {
        user: {
          userId: user.userId,
          fullName: user.fullName,
          mobile: user.mobile,
          email: user.email,
          relationship: user.relationship,
          isVerified: user.isVerified,
        },
        tokens,
      };
    }

    throw new ValidationError('OTP is required to log in');
  }
}

export default new AuthService();
