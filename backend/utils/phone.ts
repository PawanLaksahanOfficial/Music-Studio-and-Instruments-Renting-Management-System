import { env } from '../config/env';

/**
 * Normalizes a local or international phone number to E.164 (+94771234567), as required by
 * AWS SNS. Local numbers with a leading 0 get DEFAULT_COUNTRY_CODE. Returns null if invalid.
 */
export const toE164 = (raw: string, countryCode: string = env.DEFAULT_COUNTRY_CODE): string | null => {
    const cleaned = raw.trim().replace(/[\s().-]/g, '');
    let digits: string;

    if (cleaned.startsWith('+')) digits = cleaned.slice(1);
    else if (cleaned.startsWith('00')) digits = cleaned.slice(2);
    else if (cleaned.startsWith('0')) digits = countryCode + cleaned.slice(1);
    else if (cleaned.length <= 9) digits = countryCode + cleaned;
    else digits = cleaned;

    return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
};
