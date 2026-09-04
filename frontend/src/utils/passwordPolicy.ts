/** Mirrors the server's password policy so the UI fails fast, not on submit. */
export const validatePassword = (password: string): string | null => {
    if (password.length < 10) return 'Password must be at least 10 characters';
    if (password.length > 128) return 'Password must be at most 128 characters';
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        return 'Password must contain at least one letter and one number';
    }
    return null;
};

/**
 * Rough strength signal. Length dominates the score because it contributes far
 * more to real-world resistance than character-class variety does.
 */
export const passwordScore = (password: string): number => {
    if (!password) return 0;
    let points = 0;
    if (password.length >= 10) points += 1;
    if (password.length >= 14) points += 1;
    if (password.length >= 20) points += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
    if (/[^a-zA-Z0-9]/.test(password)) points += 1;
    return Math.min(points, 4);
};
