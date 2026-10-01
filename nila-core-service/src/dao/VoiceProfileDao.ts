import { putItem, getItem, queryItems, updateItem, deleteItem } from '../database/dynamoDBOperations';
import { IVoiceProfileSchema } from '../models/VoiceProfile';

export class VoiceProfileDao {
  private tableName: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_VOICE_PROFILES_TABLE || 'Nila_VoiceProfiles_prod';
  }

  async createVoice(voice: IVoiceProfileSchema): Promise<void> {
    await putItem({
      TableName: this.tableName,
      Item: voice,
    });
  }

  async getVoice(voiceId: string): Promise<IVoiceProfileSchema | null> {
    const res = await getItem({
      TableName: this.tableName,
      Key: { voiceId },
    });
    return (res.Item as IVoiceProfileSchema) || null;
  }

  async getVoicesByUserId(userId: string): Promise<IVoiceProfileSchema[]> {
    const res = await queryItems({
      TableName: this.tableName,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId },
      ScanIndexForward: false,
    });
    return (res.Items as IVoiceProfileSchema[]) || [];
  }

  async updateVoiceStatus(voiceId: string, status: 'RECORDED' | 'PROCESSING' | 'READY' | 'FAILED', previewAudioUrl?: string, aiServiceVoiceId?: string): Promise<void> {
    const timestamp = new Date().toISOString();
    let updateExp = 'SET #status = :s, updatedAt = :t';
    const attrValues: Record<string, any> = { ':s': status, ':t': timestamp };

    if (previewAudioUrl) {
      updateExp += ', previewAudioUrl = :p';
      attrValues[':p'] = previewAudioUrl;
    }
    if (aiServiceVoiceId) {
      updateExp += ', aiServiceVoiceId = :a';
      attrValues[':a'] = aiServiceVoiceId;
    }

    await updateItem({
      TableName: this.tableName,
      Key: { voiceId },
      UpdateExpression: updateExp,
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: attrValues,
    });
  }

  async deleteVoice(voiceId: string): Promise<void> {
    await deleteItem({
      TableName: this.tableName,
      Key: { voiceId },
    });
  }
}

export default new VoiceProfileDao();
