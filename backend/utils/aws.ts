import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const config = {
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
    region: process.env.AWS_REGION || 'us-east-1'
};

const snsClient = new SNSClient(config);
const sesClient = new SESClient(config);

export const sendSMS = async (phoneNumber: string, message: string) => {
    try {
        const params = {
            Message: message,
            PhoneNumber: phoneNumber,
        };
        const command = new PublishCommand(params);
        const result = await snsClient.send(command);
        console.log(`SMS sent to ${phoneNumber}: ${result.MessageId}`);
        return result;
    } catch (err) {
        console.error('AWS SNS Error:', err);
        throw err;
    }
};

export const sendEmail = async (toEmail: string, subject: string, text: string) => {
    try {
        const params = {
            Destination: { ToAddresses: [toEmail] },
            Message: {
                Body: { Text: { Data: text } },
                Subject: { Data: subject }
            },
            Source: process.env.AWS_SES_FROM_EMAIL || 'no-reply@elvistudio.com'
        };
        const command = new SendEmailCommand(params);
        const result = await sesClient.send(command);
        console.log(`Email sent to ${toEmail}: ${result.MessageId}`);
        return result;
    } catch (err: any) {
        console.error('AWS SES Error:', err);
        if (err.name === 'MessageRejected' && err.message.includes('Email address is not verified')) {
            console.error('CRITICAL: SES is in Sandbox mode or email is unverified.');
            console.error(`Verified sender email: ${process.env.AWS_SES_FROM_EMAIL}`);
            console.error(`Attempted recipient: ${toEmail}`);
        }
        throw err;
    }
};
