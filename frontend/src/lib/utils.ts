import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges Tailwind classes, letting later ones override earlier conflicting ones. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const initials = (name?: string | null) =>
    (name ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('') || '?';

export const fullName = (person?: { firstName?: string; lastName?: string } | null) =>
    person ? `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() || 'Unknown' : 'Deleted customer';
