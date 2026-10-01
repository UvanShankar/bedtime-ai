import { putItem, getItem, queryItems, updateItem } from '../database/dynamoDBOperations';
import { IUserSchema } from '../models/User';

export class UserDao {
  private tableName: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_USERS_TABLE || 'Nila_Users_prod';
  }

  async createUser(user: IUserSchema): Promise<void> {
    await putItem({
      TableName: this.tableName,
      Item: user,
    });
  }

  async getUserById(userId: string): Promise<IUserSchema | null> {
    const res = await getItem({
      TableName: this.tableName,
      Key: { userId },
    });
    return (res.Item as IUserSchema) || null;
  }

  async getUserByMobile(mobile: string): Promise<IUserSchema | null> {
    const res = await queryItems({
      TableName: this.tableName,
      IndexName: 'mobile-index',
      KeyConditionExpression: 'mobile = :m',
      ExpressionAttributeValues: { ':m': mobile },
      Limit: 1,
    });
    return res.Items && res.Items.length > 0 ? (res.Items[0] as IUserSchema) : null;
  }

  async getUserByEmail(email: string): Promise<IUserSchema | null> {
    const res = await queryItems({
      TableName: this.tableName,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :e',
      ExpressionAttributeValues: { ':e': email },
      Limit: 1,
    });
    return res.Items && res.Items.length > 0 ? (res.Items[0] as IUserSchema) : null;
  }

  async updateUser(userId: string, updates: Partial<IUserSchema>): Promise<void> {
    const timestamp = new Date().toISOString();
    const updateKeys = Object.keys(updates).filter(k => k !== 'userId');
    if (updateKeys.length === 0) return;

    let updateExp = 'SET ' + updateKeys.map(k => `#${k} = :${k}`).join(', ') + ', updatedAt = :t';
    const attrNames: Record<string, string> = {};
    const attrValues: Record<string, any> = { ':t': timestamp };

    updateKeys.forEach(k => {
      attrNames[`#${k}`] = k;
      attrValues[`:${k}`] = (updates as any)[k];
    });

    await updateItem({
      TableName: this.tableName,
      Key: { userId },
      UpdateExpression: updateExp,
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
    });
  }
}

export default new UserDao();
