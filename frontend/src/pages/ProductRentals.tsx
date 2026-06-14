import React, { useContext, useEffect, useState } from 'react';
import { StyleContext } from '../context/StyleContext';
import axios from 'axios';
import Rental from '@/types/Rental';
import AddUpdateRental from './AddUpdateRental';
import DeleteConfirmation from "../components/DeleteConfirmation";
import { AdminPanelStyles } from '../styles/AdminPanelStyles';
import { ProductRentalsStyles } from '../styles/ProductRentalsStyles';

const ProductRentals = () => {
    const { getComponentStyle } = useContext(StyleContext);
    const layoutStyles = getComponentStyle("adminLayout") as typeof AdminPanelStyles;
    const pageStyles = getComponentStyle("productRentals") as typeof ProductRentalsStyles;   
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [rentalToDelete, setRentalToDelete] = useState<Rental | null>(null);

    const fetchRentals = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/rentals');
            setRentals(response.data);
        } catch (err) {
            console.error("Failed to fetch rentals", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRentals();
    }, []);

    const handleEdit = (rental: Rental) => {
        setSelectedRental(rental);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedRental(null);
        setIsModalOpen(true);
    };

    const openDeleteModal = (rental: Rental) => {
        setRentalToDelete(rental);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!rentalToDelete) return;       
        try {
            await axios.delete(`http://localhost:5000/api/rentals/${rentalToDelete._id}`);
            fetchRentals();
            setIsDeleteModalOpen(false);
        } catch (err) {
            console.error("Failed to delete rental", err);
            alert("Delete failed.");
        }
    };

    if (loading && rentals.length === 0) return <div style={pageStyles.loading}>Loading Rentals...</div>;

    return (
        <div style={pageStyles.container}>
            <header style={pageStyles.header}>
                <h2 style={pageStyles.title}>Product Rentals</h2>
                <button style={pageStyles.actionButton} onClick={handleAddNew}>
                    + New Rental
                </button>
            </header>
            <div style={pageStyles.tableWrapper}>
                <table style={pageStyles.table}>
                    <thead>
                        <tr>
                            <th style={pageStyles.th}>ID</th>
                            <th style={pageStyles.th}>Customer</th>
                            <th style={pageStyles.th}>Item</th>
                            <th style={pageStyles.th}>Due Date</th>
                            <th style={pageStyles.th}>Status</th>
                            <th style={pageStyles.th}>Total</th>
                            <th style={pageStyles.th}>Payment</th>
                            <th style={pageStyles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rentals.length > 0 ? (
                            rentals.map((item) => (
                                <tr key={item._id}>
                                    <td style={pageStyles.td}>{item.rentalId}</td>
                                    <td style={pageStyles.td}>
                                        {item.customer.firstName} {item.customer.lastName}
                                    </td>
                                    <td style={pageStyles.td}>
                                        <strong>{item.items[0]?.itemId?.itemName || 'N/A'}</strong>
                                    </td>
                                    <td style={pageStyles.td}>
                                        {new Date(item.dueDate).toLocaleDateString()}
                                    </td>
                                    <td style={pageStyles.td}>
                                        <span style={item.status === "Rented" ? pageStyles.statusRented : pageStyles.statusOverdue}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td style={pageStyles.td}>Rs.{item.totalAmount}</td>
                                    <td style={pageStyles.td}>
                                        <span style={item.paymentStatus === "Paid" ? pageStyles.paymentPaid : pageStyles.paymentPending}>
                                            {item.paymentStatus}
                                        </span>
                                    </td>
                                    <td style={pageStyles.td}>
                                        <div style={pageStyles.actionGroup}>
                                            <button 
                                                onClick={() => handleEdit(item)}
                                                style={pageStyles.editButton}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => openDeleteModal(item)}
                                                style={pageStyles.deleteButton}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} style={pageStyles.noRentals}>No rentals found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <AddUpdateRental 
                key={selectedRental?._id || 'new'}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                refreshData={fetchRentals}
                selectedRental={selectedRental}
            />
            <DeleteConfirmation 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                itemName={rentalToDelete?.items[0]?.itemId?.itemName || "this record"}
            />
        </div>
    );
};

export default ProductRentals;
