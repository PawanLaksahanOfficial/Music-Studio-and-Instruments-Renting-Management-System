import {
    Archive, Boxes, ChartColumnBig, Guitar, MicVocal, PackageCheck, ReceiptText, ScanLine, UserCog, Users, Wrench, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    adminOnly?: boolean;
    /** Short label for the phone tab bar. */
    short?: string;
    keywords?: string[];
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Operations',
        items: [
            { label: 'Product Rentals', short: 'Rentals', path: '/admin/products', icon: Guitar, keywords: ['instruments', 'hire', 'checkout'] },
            { label: 'Studio Bookings', short: 'Studio', path: '/admin/studio', icon: MicVocal, keywords: ['rooms', 'recording', 'sessions'] },
            { label: 'Invoices', path: '/admin/invoices', icon: ReceiptText, keywords: ['billing', 'payments'] },
            { label: 'QR Checkout', short: 'Scan', path: '/admin/scanner', icon: ScanLine, keywords: ['scan', 'rent', 'qr'] },
            { label: 'QR Return', short: 'Return', path: '/admin/returns', icon: PackageCheck, keywords: ['scan', 'return', 'late fee'] },
        ],
    },
    {
        label: 'Catalog',
        items: [
            { label: 'Inventory', path: '/admin/inventory', icon: Boxes, adminOnly: true, keywords: ['items', 'stock', 'gear'] },
            { label: 'Damaged Items', path: '/admin/damaged-inventory', icon: Wrench, adminOnly: true, keywords: ['repairs', 'maintenance'] },
        ],
    },
    {
        label: 'People',
        items: [
            { label: 'Customers', path: '/admin/customers', icon: Users, adminOnly: true, keywords: ['clients', 'blacklist'] },
            { label: 'Staff Users', path: '/admin/users', icon: UserCog, adminOnly: true, keywords: ['accounts', 'cashiers', 'admins'] },
        ],
    },
    {
        label: 'Insights',
        items: [
            { label: 'Statistics', path: '/admin/stats', icon: ChartColumnBig, adminOnly: true, keywords: ['reports', 'revenue', 'analytics'] },
            { label: 'Archive', path: '/admin/archive', icon: Archive, adminOnly: true, keywords: ['restore', 'archived'] },
        ],
    },
];

export const visibleGroups = (isAdmin: boolean) =>
    NAV_GROUPS.map(group => ({ ...group, items: group.items.filter(item => !item.adminOnly || isAdmin) })).filter(group => group.items.length > 0);

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(group => group.items);

/** Destinations in the phone bottom tab bar (the rest live under "More"). */
export const MOBILE_TABS = ['/admin/products', '/admin/studio', '/admin/scanner', '/admin/returns'];
