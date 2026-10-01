import { putItem, getItem, queryItems, updateItem } from '../database/dynamoDBOperations';
import { IAIVoiceRegistrySchema } from '../models/AIVoiceRegistry';

export class AIVoiceRegistryDao {
  private tableName: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_VOICE_REGISTRY_TABLE || 'AI_VoiceRegistry_prod';
  }

  async createVoice(voice: IAIVoiceRegistrySchema): Promise<void> {
    await putItem({
      TableName: this.tableName,
      Item: voice,
    });
  }

  async getVoice(aiVoiceId: string): Promise<IAIVoiceRegistrySchema | null> {
    const res = await getItem({
      TableName: this.tableName,
      Key: { aiVoiceId },
    });
    return (res.Item as IAIVoiceRegistrySchema) || null;
  }

  async getVoiceByExternalRef(ownerProject: string, externalReferenceId: string): Promise<IAIVoiceRegistrySchema | null> {
    const res = await queryItems({
      TableName: this.tableName,
      IndexName: 'ownerProject-externalRef-index',
      KeyConditionExpression: 'ownerProject = :p AND externalReferenceId = :r',
      ExpressionAttributeValues: {
        ':p': ownerProject,
        ':r': externalReferenceId,
      },
      Limit: 1,
    });
    return (res.Items && res.Items.length > 0 ? res.Items[0] as IAIVoiceRegistrySchema : null);
  }

  async updateVoiceStatus(aiVoiceId: string, status: 'READY' | 'TRAINING' | 'FAILED', previewAudioUrl?: string): Promise<void> {
    const timestamp = new Date().toISOString();
    let updateExp = 'SET #status = :s, updatedAt = :t';
    const attrValues: Record<string, any> = {
      ':s': status,
      ':t': timestamp,
    };
    if (previewAudioUrl) {
      updateExp += ', previewAudioUrl = :u';
      attrValues[':u'] = previewAudioUrl;
    }
    await updateItem({
      TableName: this.tableName,
      Key: { aiVoiceId },
      UpdateExpression: updateExp,
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: attrValues,
    });
  }
}

export default new AIVoiceRegistryDao();
