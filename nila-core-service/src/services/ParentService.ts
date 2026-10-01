import userDao from '../dao/UserDao';
import { IUserSchema } from '../models/User';
import { NotFoundError } from '../exceptions/ApiError';

export class ParentService {
  async getProfile(userId: string): Promise<IUserSchema> {
    const user = await userDao.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return user;
  }

  async updateProfile(userId: string, updates: Partial<IUserSchema>): Promise<IUserSchema> {
    await userDao.updateUser(userId, updates);
    return await this.getProfile(userId);
  }
}

export default new ParentService();
