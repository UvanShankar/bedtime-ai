import { putItem, getItem, queryItems, updateItem, deleteItem } from '../database/dynamoDBOperations';
import { IStorySchema } from '../models/Story';

export class StoryDao {
  private tableName: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_STORIES_TABLE || 'Nila_Stories_prod';
  }

  async createStory(story: IStorySchema): Promise<void> {
    await putItem({
      TableName: this.tableName,
      Item: story,
    });
  }

  async getStory(storyId: string): Promise<IStorySchema | null> {
    const res = await getItem({
      TableName: this.tableName,
      Key: { storyId },
    });
    return (res.Item as IStorySchema) || null;
  }

  async getStoriesByUserId(userId: string): Promise<IStorySchema[]> {
    const res = await queryItems({
      TableName: this.tableName,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId },
      ScanIndexForward: false,
    });
    return (res.Items as IStorySchema[]) || [];
  }

  async getStoriesByChildId(childId: string): Promise<IStorySchema[]> {
    const res = await queryItems({
      TableName: this.tableName,
      IndexName: 'childId-createdAt-index',
      KeyConditionExpression: 'childId = :c',
      ExpressionAttributeValues: { ':c': childId },
      ScanIndexForward: false,
    });
    return (res.Items as IStorySchema[]) || [];
  }

  async updateStoryStatus(
    storyId: string,
    status: IStorySchema['status'],
    progressPercent: number,
    stageMessage?: string
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    await updateItem({
      TableName: this.tableName,
      Key: { storyId },
      UpdateExpression: 'SET #status = :s, progressPercent = :p, stageMessage = :m, updatedAt = :t',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':s': status,
        ':p': progressPercent,
        ':m': stageMessage || '',
        ':t': timestamp,
      },
    });
  }

  async completeStory(
    storyId: string,
    details: {
      storyScript: string;
      audioUrl: string;
      audioS3Key: string;
      audioDurationSeconds: number;
      coverImageUrl?: string;
    }
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    await updateItem({
      TableName: this.tableName,
      Key: { storyId },
      UpdateExpression: 'SET #status = :s, progressPercent = :p, storyScript = :scr, audioUrl = :u, audioS3Key = :k, audioDurationSeconds = :d, coverImageUrl = :c, updatedAt = :t',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':s': 'READY',
        ':p': 100,
        ':scr': details.storyScript,
        ':u': details.audioUrl,
        ':k': details.audioS3Key,
        ':d': details.audioDurationSeconds,
        ':c': details.coverImageUrl || '',
        ':t': timestamp,
      },
    });
  }

  async toggleFavorite(storyId: string, isFavorite: boolean): Promise<void> {
    const timestamp = new Date().toISOString();
    await updateItem({
      TableName: this.tableName,
      Key: { storyId },
      UpdateExpression: 'SET isFavorite = :f, updatedAt = :t',
      ExpressionAttributeValues: {
        ':f': isFavorite,
        ':t': timestamp,
      },
    });
  }

  async deleteStory(storyId: string): Promise<void> {
    await deleteItem({
      TableName: this.tableName,
      Key: { storyId },
    });
  }
}

export default new StoryDao();
