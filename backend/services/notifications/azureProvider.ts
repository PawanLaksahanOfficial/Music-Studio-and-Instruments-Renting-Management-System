import { EmailClient } from '@azure/communication-email';
import { SmsClient } from '@azure/communication-sms';
import { NotificationProvider, NotificationResult } from './types';
import { logger } from '../../utils/logger';

interface AzureProviderConfig {
    connectionString: string;
    senderAddress?: string;
    smsFromNumber?: string;
}

/**
 * Azure Communication Services provider.
 *
 * Setup notes:
 *  - Email requires a domain connected to the ACS resource; `senderAddress`
 *    must be one of its verified addresses.
 *  - SMS requires a phone number purchased through the ACS resource.
 * Either capability may be absent; the provider reports that per call rather
 * than failing at construction, so email can work while SMS is unconfigured.
 */
export class AzureNotificationProvider implements NotificationProvider {
    readonly name = 'azure';

    private readonly emailClient: EmailClient;
    private readonly smsClient: SmsClient;
    private readonly senderAddress?: string;
    private readonly smsFromNumber?: string;

    constructor(config: AzureProviderConfig) {
        this.emailClient = new EmailClient(config.connectionString);
        this.smsClient = new SmsClient(config.connectionString);
        this.senderAddress = config.senderAddress;
        this.smsFromNumber = config.smsFromNumber;
    }

    async sendEmail(to: string, subject: string, text: string): Promise<NotificationResult> {
        if (!this.senderAddress) {
            return { ok: false, error: 'AZURE_EMAIL_SENDER_ADDRESS is not configured' };
        }
        try {
            const poller = await this.emailClient.beginSend({
                senderAddress: this.senderAddress,
                content: { subject, plainText: text },
                recipients: { to: [{ address: to }] },
            });
            const result = await poller.pollUntilDone();
            logger.info({ to, messageId: result.id }, 'Email sent');
            return { ok: true, id: result.id };
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            logger.error({ err, to }, 'Azure email send failed');
            return { ok: false, error };
        }
    }

    async sendSms(to: string, message: string): Promise<NotificationResult> {
        if (!this.smsFromNumber) {
            return { ok: false, error: 'AZURE_SMS_FROM_NUMBER is not configured' };
        }
        try {
            const [result] = await this.smsClient.send({
                from: this.smsFromNumber,
                to: [to],
                message,
            });
            if (!result?.successful) {
                const error = result?.errorMessage ?? 'SMS was not accepted';
                logger.error({ to, error }, 'Azure SMS send failed');
                return { ok: false, error };
            }
            logger.info({ to, messageId: result.messageId }, 'SMS sent');
            return { ok: true, id: result.messageId };
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            logger.error({ err, to }, 'Azure SMS send failed');
            return { ok: false, error };
        }
    }
}
