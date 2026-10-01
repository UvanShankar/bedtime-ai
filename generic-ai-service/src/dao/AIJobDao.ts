import { putItem, getItem, updateItem } from '../database/dynamoDBOperations';
import { IAIJobSchema } from '../models/AIJob';

export class AIJobDao {
  private tableName: string;

  constructor() {
    this.tableName = process.env.DYNAMODB_AI_JOBS_TABLE || 'AI_Jobs_prod';
  }

  async createJob(job: IAIJobSchema): Promise<void> {
    await putItem({
      TableName: this.tableName,
      Item: job,
    });
  }

  async getJob(jobId: string): Promise<IAIJobSchema | null> {
    const res = await getItem({
      TableName: this.tableName,
      Key: { jobId },
    });
    return (res.Item as IAIJobSchema) || null;
  }

  async updateJobProgress(jobId: string, progressPercent: number, stageMessage?: string): Promise<void> {
    const timestamp = new Date().toISOString();
    await updateItem({
      TableName: this.tableName,
      Key: { jobId },
      UpdateExpression: 'SET progressPercent = :p, stageMessage = :m, status = :s, updatedAt = :t',
      ExpressionAttributeValues: {
        ':p': progressPercent,
        ':m': stageMessage || '',
        ':s': 'PROCESSING',
        ':t': timestamp,
      },
    });
  }

  async completeJob(jobId: string, resultPayload: Record<string, any>, metrics?: { tokens?: number; seconds?: number }): Promise<void> {
    const timestamp = new Date().toISOString();
    await updateItem({
      TableName: this.tableName,
      Key: { jobId },
      UpdateExpression: 'SET status = :s, progressPercent = :p, resultPayload = :r, tokensConsumed = :tok, audioSecondsGenerated = :sec, updatedAt = :t, completedAt = :t',
      ExpressionAttributeValues: {
        ':s': 'COMPLETED',
        ':p': 100,
        ':r': resultPayload,
        ':tok': metrics?.tokens || 0,
        ':sec': metrics?.seconds || 0,
        ':t': timestamp,
      },
    });
  }

  async failJob(jobId: string, errorMessage: string): Promise<void> {
    const timestamp = new Date().toISOString();
    await updateItem({
      TableName: this.tableName,
      Key: { jobId },
      UpdateExpression: 'SET status = :s, errorMessage = :e, updatedAt = :t',
      ExpressionAttributeValues: {
        ':s': 'FAILED',
        ':e': errorMessage,
        ':t': timestamp,
      },
    });
  }
}

export default new AIJobDao();
