import userDao from '../dao/UserDao';
import { ISignupDTO, ILoginDTO, IAuthResponse } from '../types';
import { generateId, generateTokens, hashPassword, comparePassword } from '../utils';
import { ValidationError, UnauthorizedError } from '../exceptions/ApiError';

export class AuthService {
  async signup(dto: ISignupDTO): Promise<IAuthResponse> {
    if (!dto.fullName) {
      throw new ValidationError('Full name is required');
    }

    if (dto.mobile) {
      const existing = await userDao.getUserByMobile(dto.mobile);
      if (existing) {
        throw new ValidationError(`User with mobile ${dto.mobile} is already registered`);
      }
    }

    if (dto.email) {
      const existing = await userDao.getUserByEmail(dto.email);
      if (existing) {
        throw new ValidationError(`User with email ${dto.email} is already registered`);
      }
    }

    const userId = generateId('usr');
    const timestamp = new Date().toISOString();
    const passwordHash = dto.password ? await hashPassword(dto.password) : undefined;

    const user = {
      userId,
      fullName: dto.fullName,
      mobile: dto.mobile,
      email: dto.email,
      passwordHash,
      relationship: dto.relationship || 'Appa',
      preferredLanguage: 'ta',
      preferredDialect: 'Standard' as const,
      isVerified: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await userDao.createUser(user);

    const tokens = generateTokens({
      userId,
      mobile: dto.mobile,
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
    if (!dto.emailOrMobile) {
      throw new ValidationError('Email or mobile number is required');
    }

    let user = await userDao.getUserByMobile(dto.emailOrMobile);
    if (!user) {
      user = await userDao.getUserByEmail(dto.emailOrMobile);
    }

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (dto.password && user.passwordHash) {
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
}

export default new AuthService();
