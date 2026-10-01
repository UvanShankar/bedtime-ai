import { putItem, getItem, deleteItem } from '../database/dynamoDBOperations';

export interface IOtpSchema {
  target: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  createdAt: string;
}

export class OtpDao {
  private tableName: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_OTP_TABLE || 'Nila_Otp_prod';
  }

  async saveOtp(target: string, otp: string, ttlMinutes = 10): Promise<void> {
    const expiresAt = Math.floor(Date.now() / 1000) + ttlMinutes * 60;
    const item: IOtpSchema = {
      target,
      otp,
      expiresAt,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };
    await putItem({
      TableName: this.tableName,
      Item: item,
    });
  }

  async getOtp(target: string): Promise<IOtpSchema | null> {
    const res = await getItem({
      TableName: this.tableName,
      Key: { target },
    });
    return (res.Item as IOtpSchema) || null;
  }

  async deleteOtp(target: string): Promise<void> {
    await deleteItem({
      TableName: this.tableName,
      Key: { target },
    });
  }
}

export default new OtpDao();
