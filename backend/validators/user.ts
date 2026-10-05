import { z } from 'zod';
import { ROLES } from '../config/constants';
import { optionalEmail, password, requiredText } from './common';

export const createUserBody = z.object({
    name: requiredText(80),
    username: z
        .string()
        .trim()
        .toLowerCase()
        .min(3, 'Username must be at least 3 characters')
        .max(40)
        .regex(/^[a-z0-9._-]+$/, 'Username may only contain letters, numbers, dots, dashes and underscores'),
    password,
    role: z.enum(ROLES).default('Cashier'),
    email: optionalEmail,
});

export const updateUserBody = z.object({
    name: requiredText(80).optional(),
    role: z.enum(ROLES).optional(),
    email: optionalEmail,
    password: password.optional(),
});
