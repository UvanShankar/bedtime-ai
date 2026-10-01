import { putItem, getItem, queryItems, updateItem, deleteItem } from '../database/dynamoDBOperations';
import { IChildSchema } from '../models/Child';

export class ChildDao {
  private tableName: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_CHILDREN_TABLE || 'Nila_Children_prod';
  }

  async createChild(child: IChildSchema): Promise<void> {
    await putItem({
      TableName: this.tableName,
      Item: child,
    });
  }

  async getChild(childId: string): Promise<IChildSchema | null> {
    const res = await getItem({
      TableName: this.tableName,
      Key: { childId },
    });
    return (res.Item as IChildSchema) || null;
  }

  async getChildrenByUserId(userId: string): Promise<IChildSchema[]> {
    const res = await queryItems({
      TableName: this.tableName,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId },
      ScanIndexForward: false, // newest first
    });
    return (res.Items as IChildSchema[]) || [];
  }

  async updateChild(childId: string, updates: Partial<IChildSchema>): Promise<void> {
    const timestamp = new Date().toISOString();
    const updateKeys = Object.keys(updates).filter(k => k !== 'childId' && k !== 'userId');
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
      Key: { childId },
      UpdateExpression: updateExp,
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
    });
  }

  async deleteChild(childId: string): Promise<void> {
    await deleteItem({
      TableName: this.tableName,
      Key: { childId },
    });
  }
}

export default new ChildDao();
