import { describe, it, expect } from 'vitest';
import { validatePassword } from './passwordPolicy';

describe('validatePassword', () => {
    it('rejects a password shorter than 10 characters', () => {
        expect(validatePassword('Ab1')).toMatch(/at least 10/);
    });

    it('rejects a password with no digit', () => {
        expect(validatePassword('LettersOnlyHere')).toMatch(/letter and one number/);
    });

    it('rejects a password with no letter', () => {
        expect(validatePassword('1234567890')).toMatch(/letter and one number/);
    });

    it('accepts a password meeting the policy — mirrors the server rule exactly', () => {
        expect(validatePassword('CorrectHorse9')).toBeNull();
    });

    it('rejects a password over 128 characters', () => {
        expect(validatePassword('a1'.repeat(70))).toMatch(/at most 128/);
    });
});
