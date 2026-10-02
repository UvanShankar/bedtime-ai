import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'ap-south-1';
const isDebugMode = process.env.DEBUG === 'true';

const hasExplicitAwsCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

let dynamoDBClientBase = new DynamoDBClient({
  region,
  ...(hasExplicitAwsCredentials && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
  ...(isDebugMode && {
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566',
  }),
});

export const docClient = DynamoDBDocumentClient.from(dynamoDBClientBase, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export async function putItem(params: { TableName: string; Item: Record<string, any> }) {
  const command = new PutCommand(params);
  return await docClient.send(command);
}

export async function getItem(params: { TableName: string; Key: Record<string, any> }) {
  const command = new GetCommand(params);
  return await docClient.send(command);
}

export async function updateItem(params: {
  TableName: string;
  Key: Record<string, any>;
  UpdateExpression: string;
  ExpressionAttributeValues: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
  ReturnValues?: 'NONE' | 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW';
}) {
  const command = new UpdateCommand(params);
  return await docClient.send(command);
}

export async function deleteItem(params: { TableName: string; Key: Record<string, any> }) {
  const command = new DeleteCommand(params);
  return await docClient.send(command);
}

export async function queryItems(params: {
  TableName: string;
  IndexName?: string;
  KeyConditionExpression: string;
  ExpressionAttributeValues: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
  ScanIndexForward?: boolean;
  Limit?: number;
}) {
  const command = new QueryCommand(params);
  return await docClient.send(command);
}
