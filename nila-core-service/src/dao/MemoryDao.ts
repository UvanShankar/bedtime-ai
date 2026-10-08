import { putItem, getItem, queryItems, updateItem, deleteItem } from '../database/dynamoDBOperations';
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

  async updateMemory(memoryId: string, updates: Partial<IMemorySchema>): Promise<void> {
    const timestamp = new Date().toISOString();
    const updateKeys = Object.keys(updates).filter(k => k !== 'memoryId' && k !== 'userId');
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
      Key: { memoryId },
      UpdateExpression: updateExp,
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
    });
  }

  async deleteMemory(memoryId: string): Promise<void> {
    await deleteItem({
      TableName: this.tableName,
      Key: { memoryId },
    });
  }
}

export default new MemoryDao();
