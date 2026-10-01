import { putItem, getItem, queryItems, deleteItem } from '../database/dynamoDBOperations';
import { IMemorySchema } from '../models/Memory';

export class MemoryDao {
  private tableName: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_MEMORIES_TABLE || 'Nila_Memories_prod';
  }

  async createMemory(memory: IMemorySchema): Promise<void> {
    await putItem({
      TableName: this.tableName,
      Item: memory,
    });
  }

  async getMemory(memoryId: string): Promise<IMemorySchema | null> {
    const res = await getItem({
      TableName: this.tableName,
      Key: { memoryId },
    });
    return (res.Item as IMemorySchema) || null;
  }

  async getMemoriesByUserId(userId: string): Promise<IMemorySchema[]> {
    const res = await queryItems({
      TableName: this.tableName,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId },
      ScanIndexForward: false,
    });
    return (res.Items as IMemorySchema[]) || [];
  }

  async getMemoriesByChildId(childId: string): Promise<IMemorySchema[]> {
    const res = await queryItems({
      TableName: this.tableName,
      IndexName: 'childId-createdAt-index',
      KeyConditionExpression: 'childId = :c',
      ExpressionAttributeValues: { ':c': childId },
      ScanIndexForward: false,
    });
    return (res.Items as IMemorySchema[]) || [];
  }

  async deleteMemory(memoryId: string): Promise<void> {
    await deleteItem({
      TableName: this.tableName,
      Key: { memoryId },
    });
  }
}

export default new MemoryDao();
