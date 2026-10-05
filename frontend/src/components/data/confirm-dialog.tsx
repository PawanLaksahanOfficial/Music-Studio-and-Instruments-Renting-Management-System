import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Info } from 'lucide-react';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertDialogCancel, AlertDialogShell } from '@/components/ui/dialog';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    confirmLabel: string;
    tone?: 'default' | 'destructive';
    /** Runs the action. Errors are shown as a toast and keep the dialog open. */
    onConfirm: () => Promise<unknown>;
    successMessage?: string;
}

export const ConfirmDialog = ({ open, onOpenChange, title, description, confirmLabel, tone = 'default', onConfirm, successMessage }: ConfirmDialogProps) => {
    const [busy, setBusy] = useState(false);
    const destructive = tone === 'destructive';

    const confirm = async () => {
        setBusy(true);
        try {
            await onConfirm();
            if (successMessage) toast.success(successMessage);
            onOpenChange(false);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AlertDialogShell
            open={open}
            onOpenChange={next => !busy && onOpenChange(next)}
            icon={
                <span className={cn('grid size-12 place-items-center rounded-2xl', destructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>
                    {destructive ? <AlertTriangle className="size-6" /> : <Info className="size-6" />}
                </span>
            }
            title={title}
            description={description}
            footer={
                <>
                    <AlertDialogCancel asChild>
                        <Button variant="outline" disabled={busy}>Cancel</Button>
                    </AlertDialogCancel>
                    <Button variant={destructive ? 'destructive' : 'default'} loading={busy} onClick={confirm}>
                        {confirmLabel}
                    </Button>
                </>
            }
        />
    );
};
