import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
    it('is not rendered when closed', () => {
        render(
            <Modal isOpen={false} onClose={vi.fn()} title="Test">
                content
            </Modal>
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders with dialog semantics and the title as its accessible name', () => {
        render(
            <Modal isOpen onClose={vi.fn()} title="Add item">
                content
            </Modal>
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAccessibleName('Add item');
    });

    it('calls onClose on Escape — the previous bare-div modals did not', async () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen onClose={onClose} title="Test">
                content
            </Modal>
        );
        await userEvent.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when the backdrop is clicked', () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen onClose={onClose} title="Test">
                content
            </Modal>
        );
        // The overlay is the dialog's parent; clicking it (not its content) should close.
        const overlay = screen.getByRole('dialog').parentElement!;
        fireEvent.mouseDown(overlay);
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not close when clicking inside the dialog content', () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen onClose={onClose} title="Test">
                <button type="button">Inside</button>
            </Modal>
        );
        fireEvent.mouseDown(screen.getByText('Inside'));
        expect(onClose).not.toHaveBeenCalled();
    });

    it('moves focus inside the dialog on open', () => {
        render(
            <Modal isOpen onClose={vi.fn()} title="Test">
                <input aria-label="First field" />
            </Modal>
        );
        expect(screen.getByLabelText('First field')).toHaveFocus();
    });
});
