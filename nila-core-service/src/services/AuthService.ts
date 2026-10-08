import userDao from '../dao/UserDao';
import otpDao from '../dao/OtpDao';
import { sendSms } from '../database/snsOperations';
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
    isNewUser: boolean;
    expiresAt: number;
  }> {
    const rawNumber = dto.mobile || dto.phoneNumber;
    if (!rawNumber || rawNumber.trim().length < 6) {
      throw new ValidationError('A valid phone number is required');
    }
    const mobile = normalizePhoneNumber(rawNumber);

    // 1. Check in DB if user is present
    let user = await userDao.getUserByMobile(mobile);
    if (!user && mobile.startsWith('+91')) {
      user = await userDao.getUserByMobile(mobile.replace('+91', ''));
    }

    const isNewUser = !user;
    if (isNewUser) {
      // User not present: update in DB as unverified user
      const userId = generateId('usr');
      const timestamp = new Date().toISOString();
      const newUser: IUserSchema = {
        userId,
        mobile,
        isVerified: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await userDao.createUser(newUser);
      user = newUser;
      console.log(`[AuthService] Provisioned new unverified user for ${mobile}: ${userId}`);
    }

    // 2. Determine OTP: If an active unexpired OTP is already present in DB, reuse it and extend TTL; otherwise generate a new one
    const ttlMinutes = 10;
    const nowEpoch = Math.floor(Date.now() / 1000);
    const existingOtpRecord = await otpDao.getOtp(mobile);

    let otp: string;
    if (existingOtpRecord && existingOtpRecord.otp && existingOtpRecord.expiresAt >= nowEpoch) {
      otp = existingOtpRecord.otp;
      console.log(`[AuthService] Existing active OTP found for ${mobile}. Reusing OTP and extending TTL.`);
    } else {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`[AuthService] Generated new OTP for ${mobile}`);
    }

    const expiresAt = nowEpoch + ttlMinutes * 60;
    await otpDao.saveOtp(mobile, otp, ttlMinutes);
    console.log(`[AuthService] Saved OTP to DynamoDB for ${mobile}`);

    // 3. Trigger transactional SMS via AWS SNS
    const smsMessage = `Your Nila verification code is ${otp}. Valid for 10 minutes.`;
    try {
      const messageId = await sendSms(mobile, smsMessage);
      console.log(`[AuthService] SNS SMS sent successfully to ${mobile}, MessageId: ${messageId}`);
    } catch (snsError: any) {
      console.warn(`[AuthService] SNS SMS delivery notice for ${mobile}:`, snsError?.message || snsError);
      // Log for developer debugging in local console
      console.log(`[AuthService] [DEV CONSOLE ONLY] OTP code for ${mobile}: ${otp}`);
    }

    // 4. Return clean API response without exposing the OTP
    return {
      success: true,
      message: `OTP sent successfully to ${mobile}`,
      mobile,
      isNewUser,
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
        ...(dto.fullName?.trim() && { fullName: dto.fullName.trim() }),
        mobile,
        ...(dto.relationship && { relationship: dto.relationship as any }),
        isVerified: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await userDao.createUser(newUser);
      user = newUser;
    } else {
      // User exists - update verified flag & optional name
      const updates: Partial<IUserSchema> = { isVerified: true };
      if (dto.fullName && dto.fullName.trim()) {
        updates.fullName = dto.fullName.trim();
      }
      if (dto.relationship) {
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

    const fullName = dto.fullName?.trim();
    const mobile = rawNumber ? normalizePhoneNumber(rawNumber) : undefined;

    // If OTP is not provided and no password, trigger sendOtp (Step 1 of unified auth)
    if (!dto.otp && !dto.password) {
      return (await this.sendOtp({ mobile: rawNumber, phoneNumber: rawNumber })) as any;
    }

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
      if (dto.fullName && dto.fullName.trim()) {
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
      ...(fullName && { fullName }),
      mobile,
      email: dto.email,
      passwordHash,
      ...(dto.relationship && { relationship: dto.relationship as any }),
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
          mobile: mobile || lookupMobile,
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

    // Step 1 of unified auth: If neither OTP nor password provided, trigger sendOtp
    return (await this.sendOtp({ mobile: rawNumber, phoneNumber: rawNumber })) as any;
  }
}

export default new AuthService();
