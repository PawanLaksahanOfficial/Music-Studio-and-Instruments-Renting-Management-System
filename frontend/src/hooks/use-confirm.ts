import { useState } from 'react';

/** State helper for "confirm an action on a specific record" (pairs with <ConfirmDialog>). */
export const useConfirm = <T,>() => {
    const [target, setTarget] = useState<T | null>(null);
    return {
        target,
        open: (item: T) => setTarget(item),
        dialogProps: { open: target !== null, onOpenChange: (open: boolean) => !open && setTarget(null) },
    };
};
