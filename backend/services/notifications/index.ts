import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { NotificationProvider } from './types';
import { AzureNotificationProvider } from './azureProvider';
import { ConsoleNotificationProvider } from './consoleProvider';

const buildProvider = (): NotificationProvider => {
    if (env.AZURE_COMMUNICATION_CONNECTION_STRING) {
        return new AzureNotificationProvider({
            connectionString: env.AZURE_COMMUNICATION_CONNECTION_STRING,
            senderAddress: env.AZURE_EMAIL_SENDER_ADDRESS,
            smsFromNumber: env.AZURE_SMS_FROM_NUMBER,
        });
    }
    if (env.isProduction) {
        logger.warn('AZURE_COMMUNICATION_CONNECTION_STRING is unset in production — notifications will only be logged');
    }
    return new ConsoleNotificationProvider();
};

export const notifications: NotificationProvider = buildProvider();

export * from './types';
