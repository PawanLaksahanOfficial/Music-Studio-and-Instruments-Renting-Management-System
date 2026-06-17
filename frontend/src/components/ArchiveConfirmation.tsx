import React from 'react';
import { ArchiveConfirmationStyles as styles } from '../styles/ArchiveConfirmationStyles';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
}

const ArchiveConfirmation = ({ isOpen, onClose, onConfirm, itemName }: Props) => {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modalContent}>
                <div style={styles.archiveIcon}>📦</div>
                <h3 style={styles.title}>Archive Record?</h3>
                <p style={styles.message}>
                    Are you sure you want to archive <strong>{itemName}</strong>?
                    This will move it to the archived section.
                </p>

                <div style={styles.buttonRow}>
                    <button onClick={onClose} style={styles.cancelButton}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} style={styles.confirmButton}>
                        Yes, Archive
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchiveConfirmation;