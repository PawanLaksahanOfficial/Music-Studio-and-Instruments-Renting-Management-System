/**
 * The application talks to this interface only — no cloud SDK is imported
 * outside `./azureProvider`. Swapping providers means adding one file, not
 * touching call sites, which is the mistake the AWS integration made.
 */
export interface NotificationProvider {
    readonly name: string;
    sendEmail(to: string, subject: string, text: string): Promise<NotificationResult>;
    sendSms(to: string, message: string): Promise<NotificationResult>;
}

export interface NotificationResult {
    ok: boolean;
    id?: string;
    /** Populated when ok is false. Delivery failures are reported, not thrown. */
    error?: string;
}
