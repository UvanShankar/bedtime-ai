import { putItem, getItem, queryItems, updateItem } from '../database/dynamoDBOperations';
import { IAIVoiceRegistrySchema } from '../models/AIVoiceRegistry';

export class AIVoiceRegistryDao {
  private tableName: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_VOICE_REGISTRY_TABLE || 'AI_VoiceRegistry_prod';
  }

  async createVoice(voice: IAIVoiceRegistrySchema): Promise<void> {
    const item: Record<string, any> = {
      ...voice,
      voiceId: voice.voiceId || voice.aiVoiceId,
      aiVoiceId: voice.aiVoiceId || voice.voiceId,
      provider: (voice.provider || voice.voiceProvider || 'sarvam').toLowerCase(),
      voiceProvider: (voice.voiceProvider || voice.provider || 'sarvam').toLowerCase(),
    };
    await putItem({
      TableName: this.tableName,
      Item: item,
    });
  }

  async getVoice(aiVoiceId: string, provider?: string): Promise<IAIVoiceRegistrySchema | null> {
    const cleanProvider = provider ? provider.toLowerCase().trim() : undefined;

    // 1. If provider is supplied, try direct composite primary key lookup { aiVoiceId, provider }
    if (cleanProvider) {
      try {
        const res = await getItem({
          TableName: this.tableName,
          Key: { aiVoiceId, provider: cleanProvider },
        });
        if (res.Item) return res.Item as IAIVoiceRegistrySchema;
      } catch (err: any) {
        // If table KeySchema only has HASH key 'aiVoiceId', fallback to single key lookup
      }
    }

    // 2. Try single HASH key lookup { aiVoiceId }
    try {
      const res = await getItem({
        TableName: this.tableName,
        Key: { aiVoiceId },
      });
      if (res.Item) {
        const item = res.Item as IAIVoiceRegistrySchema;
        // If caller requested a specific provider, ensure it matches
        if (!cleanProvider || item.provider?.toLowerCase() === cleanProvider || item.voiceProvider?.toLowerCase() === cleanProvider) {
          return item;
        }
      }
    } catch (err: any) {
      // If table requires composite primary key (aiVoiceId + provider), getItem without range key throws ValidationException.
    }

    // 3. Fallback: Query by partition key to find the item (and match provider if requested)
    try {
      const queryRes = await queryItems({
        TableName: this.tableName,
        KeyConditionExpression: 'aiVoiceId = :v',
        ExpressionAttributeValues: { ':v': aiVoiceId },
      });
      if (queryRes.Items && queryRes.Items.length > 0) {
        if (cleanProvider) {
          const match = queryRes.Items.find((it: any) =>
            it.provider?.toLowerCase() === cleanProvider || it.voiceProvider?.toLowerCase() === cleanProvider
          );
          if (match) return match as IAIVoiceRegistrySchema;
        }
        return queryRes.Items[0] as IAIVoiceRegistrySchema;
      }
    } catch (err: any) {
      // Table may not have aiVoiceId as partition key or scan needed
    }

    return null;
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

  async updateVoiceStatus(
    aiVoiceId: string,
    status: 'READY' | 'TRAINING' | 'FAILED',
    previewAudioUrl?: string,
    provider?: string
  ): Promise<void> {
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

    // Determine Key: try composite key if provider known, fallback to single key
    const cleanProvider = provider ? provider.toLowerCase().trim() : undefined;
    if (cleanProvider) {
      try {
        await updateItem({
          TableName: this.tableName,
          Key: { aiVoiceId, provider: cleanProvider },
          UpdateExpression: updateExp,
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: attrValues,
        });
        return;
      } catch (err: any) {
        // Fallback to single key if table does not have provider as sort key
      }
    }

    try {
      await updateItem({
        TableName: this.tableName,
        Key: { aiVoiceId },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: attrValues,
      });
    } catch (err: any) {
      // If table requires composite key, fetch provider first then update
      const existing = await this.getVoice(aiVoiceId);
      if (existing && existing.provider) {
        await updateItem({
          TableName: this.tableName,
          Key: { aiVoiceId, provider: existing.provider },
          UpdateExpression: updateExp,
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: attrValues,
        });
      }
    }
  }
}

export default new AIVoiceRegistryDao();
