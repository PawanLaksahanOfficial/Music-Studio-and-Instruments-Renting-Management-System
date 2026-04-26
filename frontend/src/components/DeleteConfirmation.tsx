import React, { useContext } from 'react';
import { StyleContext } from '../context/StyleContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
}

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, itemName }: Props) => {
    const { getComponentStyle } = useContext(StyleContext);
    const styles = getComponentStyle("addUpdateRentals");

    if (!isOpen) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ fontSize: '50px', color: '#e74c3c', marginBottom: '10px' }}>⚠️</div>
                <h3 style={{ margin: '0 0 10px 0' }}>Delete Rental?</h3>
                <p style={{ color: '#666', marginBottom: '25px' }}>
                    Are you sure you want to delete the rental for <strong>{itemName}</strong>? 
                    This will return the item to inventory.
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button 
                        onClick={onClose} 
                        style={{ ...styles.cancelButton, flex: 1 }}
                    >
                        Keep It
                    </button>
                    <button 
                        onClick={onConfirm} 
                        style={{ ...styles.submitButton, backgroundColor: '#e74c3c', flex: 1 }}
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmation;