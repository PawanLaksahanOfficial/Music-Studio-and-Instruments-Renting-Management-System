import { z } from 'zod';
import { password } from './common';

export const loginBody = z.object({
    username: z.string().trim().min(1, 'Username is required').max(64),
    password: z.string().min(1, 'Password is required').max(128),
});

export const changePasswordBody = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required').max(128),
        newPassword: password,
    })
    .refine(b => b.currentPassword !== b.newPassword, { message: 'New password must be different', path: ['newPassword'] });
