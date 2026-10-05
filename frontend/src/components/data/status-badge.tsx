import { Badge, type BadgeTone } from '@/components/ui/badge';

const TONES: Record<string, BadgeTone> = {
    // Rentals
    Rented: 'info',
    Overdue: 'danger',
    Returned: 'success',
    // Payments
    Paid: 'success',
    Pending: 'warning',
    Partial: 'violet',
    // Inventory
    Available: 'success',
    Maintenance: 'warning',
    Damaged: 'danger',
    Lost: 'neutral',
    // Studio
    Confirmed: 'primary',
    Completed: 'success',
    Cancelled: 'neutral',
    // People
    Admin: 'violet',
    Cashier: 'info',
    Active: 'success',
    Inactive: 'neutral',
    Blacklisted: 'danger',
};

/** Colour-coded status pill; the status text is always shown, so colour is never the only cue. */
export const StatusBadge = ({ status, className }: { status: string; className?: string }) => (
    <Badge tone={TONES[status] ?? 'neutral'} dot className={className}>
        {status}
    </Badge>
);
