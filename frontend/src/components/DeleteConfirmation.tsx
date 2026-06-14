import React from 'react';
import { DeleteConfirmationStyles as styles } from '../styles/DeleteConfirmationStyles';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
}

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, itemName }: Props) => {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modalContent}>
                <div style={styles.warningIcon}>⚠️</div>
                <h3 style={styles.title}>Delete Rental?</h3>
                <p style={styles.message}>
                    Are you sure you want to delete the rental for <strong>{itemName}</strong>?
                    This will return the item to inventory.
                </p>

                <div style={styles.buttonRow}>
                    <button
                        onClick={onClose}
                        style={styles.cancelButton}
                    >
                        Keep It
                    </button>
                    <button
                        onClick={onConfirm}
                        style={styles.submitButton}
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmation;