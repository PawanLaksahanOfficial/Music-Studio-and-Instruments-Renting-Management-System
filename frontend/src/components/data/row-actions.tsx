import type { ReactNode } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/menus';

export interface RowAction {
    label: string;
    icon: ReactNode;
    onSelect: () => void;
    destructive?: boolean;
    hidden?: boolean;
    disabled?: boolean;
}

/** "⋮" menu for a table row or card. Destructive actions are grouped at the bottom. */
export const RowActions = ({ actions, label = 'Actions' }: { actions: RowAction[]; label?: string }) => {
    const visible = actions.filter(a => !a.hidden);
    if (visible.length === 0) return null;
    const regular = visible.filter(a => !a.destructive);
    const destructive = visible.filter(a => a.destructive);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={label} onClick={e => e.stopPropagation()}>
                    <EllipsisVertical />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={e => e.stopPropagation()}>
                {regular.map(a => (
                    <DropdownMenuItem key={a.label} icon={a.icon} disabled={a.disabled} onSelect={a.onSelect}>{a.label}</DropdownMenuItem>
                ))}
                {regular.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}
                {destructive.map(a => (
                    <DropdownMenuItem key={a.label} icon={a.icon} disabled={a.disabled} destructive onSelect={a.onSelect}>{a.label}</DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
