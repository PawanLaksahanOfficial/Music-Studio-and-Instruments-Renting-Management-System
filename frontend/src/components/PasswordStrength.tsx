import { passwordScore } from '../utils/passwordPolicy';

const LEVELS = [
    { label: 'Too short', tone: 'var(--c-danger)' },
    { label: 'Weak', tone: 'var(--c-danger)' },
    { label: 'Fair', tone: 'var(--c-warning)' },
    { label: 'Good', tone: 'var(--c-info)' },
    { label: 'Strong', tone: 'var(--c-success)' },
];

export const PasswordStrength = ({ password }: { password: string }) => {
    if (!password) return null;

    const value = passwordScore(password);
    const level = LEVELS[value];

    return (
        <div>
            <div
                className="row"
                style={{ gap: 4 }}
                role="meter"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={4}
                aria-label={`Password strength: ${level.label}`}
            >
                {[0, 1, 2, 3].map(i => (
                    <div
                        key={i}
                        style={{
                            height: 4,
                            flex: 1,
                            borderRadius: 2,
                            background: i < value ? level.tone : 'var(--c-border)',
                            transition: 'background var(--transition)',
                        }}
                    />
                ))}
            </div>
            <span className="field__hint">Strength: {level.label}</span>
        </div>
    );
};
