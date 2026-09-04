import { NotificationProvider, NotificationResult } from './types';
import { logger } from '../../utils/logger';

/**
 * Development fallback used when Azure is not configured. Logs what would
 * have been sent so reminder and credential flows are fully testable without
 * a cloud account or a verified domain.
 */
export class ConsoleNotificationProvider implements NotificationProvider {
    readonly name = 'console';

    async sendEmail(to: string, subject: string, text: string): Promise<NotificationResult> {
        logger.info({ channel: 'email', to, subject, text }, '[console provider] email not sent — no Azure config');
        return { ok: true, id: `console-${Date.now()}` };
    }

    async sendSms(to: string, message: string): Promise<NotificationResult> {
        logger.info({ channel: 'sms', to, message }, '[console provider] SMS not sent — no Azure config');
        return { ok: true, id: `console-${Date.now()}` };
    }
}
