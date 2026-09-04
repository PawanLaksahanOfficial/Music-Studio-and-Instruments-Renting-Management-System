import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: labelled, Escape-dismissable, and focus-trapped.
 *
 * The previous modals were bare divs — screen readers did not announce them,
 * Escape did nothing, and Tab walked out into the page behind the overlay.
 */
const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);
    const titleId = useId();

    useEffect(() => {
        if (!isOpen) return;

        previouslyFocused.current = document.activeElement as HTMLElement;
        // Prevent the page behind the overlay from scrolling with the modal.
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Focus the first control in the body content, so keyboard users land
        // on the form rather than on the header's close button, which is
        // first in DOM order but rarely what someone opening the dialog wants.
        const first = bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE);
        (first ?? dialogRef.current)?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
                return;
            }
            if (e.key !== 'Tab') return;

            const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
            if (focusable.length === 0) return;

            const firstEl = focusable[0];
            const lastEl = focusable[focusable.length - 1];
            // Wrap focus at both ends so Tab cannot escape the dialog.
            if (e.shiftKey && document.activeElement === firstEl) {
                e.preventDefault();
                lastEl.focus();
            } else if (!e.shiftKey && document.activeElement === lastEl) {
                e.preventDefault();
                firstEl.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = originalOverflow;
            previouslyFocused.current?.focus();
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onMouseDown={e => {
                // Only a click that both starts and ends on the backdrop closes
                // the modal — dragging a text selection out must not.
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                className={`modal modal--${size}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
            >
                <div className="modal__header">
                    <h2 id={titleId} className="card__title" style={{ margin: 0 }}>
                        {title}
                    </h2>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={onClose} aria-label="Close dialog">
                        ✕
                    </button>
                </div>
                <div className="modal__body" ref={bodyRef}>
                    {children}
                </div>
                {footer && <div className="modal__footer">{footer}</div>}
            </div>
        </div>
    );
};

export default Modal;
