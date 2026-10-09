import { putItem, getItem, queryItems, updateItem, deleteItem } from '../database/dynamoDBOperations';
import { IVoiceProfileSchema } from '../models/VoiceProfile';

export class VoiceProfileDao {
  private tableName: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_VOICE_PROFILES_TABLE || 'Nila_VoiceProfiles_prod';
  }

  async createVoice(voice: IVoiceProfileSchema): Promise<void> {
    const item = {
      ...voice,
      provider: (voice.provider || voice.voiceProvider || 'sarvam').toLowerCase(),
      voiceProvider: (voice.voiceProvider || voice.provider || 'sarvam').toLowerCase(),
    };
    await putItem({
      TableName: this.tableName,
      Item: item,
    });
  }

  async getVoice(voiceId: string, provider?: string): Promise<IVoiceProfileSchema | null> {
    const cleanProvider = provider ? provider.toLowerCase().trim() : undefined;

    // 1. If provider is supplied, try direct composite primary key lookup { voiceId, provider }
    if (cleanProvider) {
      try {
        const res = await getItem({
          TableName: this.tableName,
          Key: { voiceId, provider: cleanProvider },
        });
        if (res.Item) return res.Item as IVoiceProfileSchema;
      } catch (err: any) {
        // If table KeySchema only has HASH key 'voiceId', fallback to single key lookup
      }
    }

    // 2. Try single HASH key lookup { voiceId }
    try {
      const res = await getItem({
        TableName: this.tableName,
        Key: { voiceId },
      });
      if (res.Item) {
        const item = res.Item as IVoiceProfileSchema;
        if (!cleanProvider || item.provider?.toLowerCase() === cleanProvider || item.voiceProvider?.toLowerCase() === cleanProvider) {
          return item;
        }
      }
    } catch (err: any) {
      // If table requires composite primary key (voiceId + provider), getItem without range key throws ValidationException.
    }

    // 3. Fallback: Query by partition key to find the item (and match provider if requested)
    try {
      const queryRes = await queryItems({
        TableName: this.tableName,
        KeyConditionExpression: 'voiceId = :v',
        ExpressionAttributeValues: { ':v': voiceId },
      });
      if (queryRes.Items && queryRes.Items.length > 0) {
        if (cleanProvider) {
          const match = queryRes.Items.find((it: any) =>
            it.provider?.toLowerCase() === cleanProvider || it.voiceProvider?.toLowerCase() === cleanProvider
          );
          if (match) return match as IVoiceProfileSchema;
        }
        return queryRes.Items[0] as IVoiceProfileSchema;
      }
    } catch (err: any) {
      // Index / query fallback
    }

    return null;
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

  async updateVoiceStatus(
    voiceId: string,
    status: 'RECORDED' | 'PROCESSING' | 'READY' | 'FAILED',
    previewAudioUrl?: string,
    aiServiceVoiceId?: string,
    provider?: string,
    providerVoiceId?: string
  ): Promise<void> {
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
    if (provider) {
      updateExp += ', provider = :prv, voiceProvider = :prv';
      attrValues[':prv'] = provider.toLowerCase();
    }
    if (providerVoiceId) {
      updateExp += ', providerVoiceId = :pvi';
      attrValues[':pvi'] = providerVoiceId;
    }

    const cleanProvider = provider ? provider.toLowerCase().trim() : undefined;
    if (cleanProvider) {
      try {
        await updateItem({
          TableName: this.tableName,
          Key: { voiceId, provider: cleanProvider },
          UpdateExpression: updateExp,
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: attrValues,
        });
        return;
      } catch (err: any) {
        // Fallback to single key
      }
    }

    try {
      await updateItem({
        TableName: this.tableName,
        Key: { voiceId },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: attrValues,
      });
    } catch (err: any) {
      // If table requires composite key, fetch provider first then update
      const existing = await this.getVoice(voiceId);
      if (existing && existing.provider) {
        await updateItem({
          TableName: this.tableName,
          Key: { voiceId, provider: existing.provider },
          UpdateExpression: updateExp,
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: attrValues,
        });
      }
    }
  }

  async deleteVoice(voiceId: string, provider?: string): Promise<void> {
    const cleanProvider = provider ? provider.toLowerCase().trim() : undefined;
    if (cleanProvider) {
      try {
        await deleteItem({
          TableName: this.tableName,
          Key: { voiceId, provider: cleanProvider },
        });
        return;
      } catch (err: any) {
        // Fallback to single key
      }
    }

    try {
      await deleteItem({
        TableName: this.tableName,
        Key: { voiceId },
      });
    } catch (err: any) {
      const existing = await this.getVoice(voiceId);
      if (existing && existing.provider) {
        await deleteItem({
          TableName: this.tableName,
          Key: { voiceId, provider: existing.provider },
        });
      }
    }
  }
}

export default new VoiceProfileDao();
