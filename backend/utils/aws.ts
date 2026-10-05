import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { env } from '../config/env';
import { AppError, badRequest } from './AppError';
import { logger, maskEmail, maskPhone } from './logger';
import { toE164 } from './phone';

// Clients are created on first use, after configuration is loaded. Without explicit keys the
// AWS SDK default credential chain is used (IAM role, ~/.aws, environment).
const clientConfig = () => ({
    region: env.AWS_REGION,
    ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
        ? { credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY } }
        : {}),
});

let snsClient: SNSClient | undefined;
let sesClient: SESClient | undefined;
const sns = () => (snsClient ??= new SNSClient(clientConfig()));
const ses = () => (sesClient ??= new SESClient(clientConfig()));

export const sendSMS = async (phoneNumber: string, message: string) => {
    const to = toE164(phoneNumber);
    if (!to) throw badRequest('Invalid phone number for SMS');

    try {
        const result = await sns().send(new PublishCommand({ Message: message, PhoneNumber: to }));
        logger.info({ event: 'notify.sms_sent', to: maskPhone(to), messageId: result.MessageId }, 'SMS sent');
        return result;
    } catch (err) {
        logger.error({ event: 'notify.sms_failed', to: maskPhone(to), err }, 'SMS sending failed');
        throw err;
    }
};

export const isEmailConfigured = () => Boolean(env.AWS_SES_FROM_EMAIL);

export const sendEmail = async (toEmail: string, subject: string, text: string) => {
    if (!env.AWS_SES_FROM_EMAIL) {
        throw new AppError(503, 'Email sending is not configured on the server', 'EMAIL_NOT_CONFIGURED');
    }

    try {
        const result = await ses().send(new SendEmailCommand({
            Destination: { ToAddresses: [toEmail] },
            Message: { Body: { Text: { Data: text } }, Subject: { Data: subject } },
            Source: env.AWS_SES_FROM_EMAIL,
        }));
        logger.info({ event: 'notify.email_sent', to: maskEmail(toEmail), messageId: result.MessageId }, 'Email sent');
        return result;
    } catch (err) {
        const e = err as { name?: string; message?: string };
        const hint = e.name === 'MessageRejected' && e.message?.includes('not verified')
            ? 'SES is in sandbox mode or the address is unverified'
            : undefined;
        logger.error({ event: 'notify.email_failed', to: maskEmail(toEmail), hint, err }, 'Email sending failed');
        throw err;
    }
};
