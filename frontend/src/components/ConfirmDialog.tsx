import { useState } from 'react';
import Modal from './Modal';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: 'danger' | 'primary';
}

/**
 * Replaces `window.confirm`, which blocks the whole browser, cannot be styled
 * and reads as a browser warning rather than part of the app.
 */
const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    tone = 'danger',
}: ConfirmDialogProps) => {
    const [busy, setBusy] = useState(false);

    const handleConfirm = async () => {
        setBusy(true);
        try {
            await onConfirm();
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <button type="button" className="btn" onClick={onClose} disabled={busy}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={`btn btn--${tone}`}
                        onClick={handleConfirm}
                        disabled={busy}
                    >
                        {busy ? <span className="spinner" aria-hidden="true" /> : null}
                        {busy ? 'Working…' : confirmLabel}
                    </button>
                </>
            }
        >
            <p className="muted">{message}</p>
        </Modal>
    );
};

export default ConfirmDialog;
