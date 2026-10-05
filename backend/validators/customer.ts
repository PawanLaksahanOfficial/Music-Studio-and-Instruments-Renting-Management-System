import { z } from 'zod';
import { optionalEmail, optionalText, phone, requiredText } from './common';

const nicOrPassport = z
    .string()
    .trim()
    .toUpperCase()
    .min(5, 'NIC / passport number is too short')
    .max(20, 'NIC / passport number is too long')
    .regex(/^[A-Z0-9-]+$/, 'NIC / passport may only contain letters, numbers and dashes');

export const createCustomerBody = z.object({
    firstName: requiredText(60),
    lastName: requiredText(60),
    phone,
    email: optionalEmail,
    address: optionalText(200),
    nicOrPassport,
});

export const updateCustomerBody = createCustomerBody.partial();
