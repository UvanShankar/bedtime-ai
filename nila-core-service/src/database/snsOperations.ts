import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const region = process.env.AWS_REGION || 'ap-south-1';
const isLambda = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV);
const hasExplicitAwsCredentials = !isLambda && !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

export const snsClient = new SNSClient({
  region,
  ...(hasExplicitAwsCredentials && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
    },
  }),
});

/**
 * Sends a transactional SMS via AWS SNS
 * @param phoneNumber E.164 formatted phone number (+91...)
 * @param message SMS body text
 * @returns SNS MessageId
 */
export async function sendSms(phoneNumber: string, message: string): Promise<string | undefined> {
  const command = new PublishCommand({
    PhoneNumber: phoneNumber,
    Message: message,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional',
      },
      'AWS.SNS.SMS.SenderID': {
        DataType: 'String',
        StringValue: 'NilaApp',
      },
    },
  });

  const response = await snsClient.send(command);
  return response.MessageId;
}
