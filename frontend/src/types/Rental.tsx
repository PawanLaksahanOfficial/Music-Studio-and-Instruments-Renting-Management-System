interface Rental {
    _id: string;
    rentalId: string;
    customer: {
        _id: string;
        firstName: string;
        lastName: string;
        phone: string;
    };
    items: Array<{
        itemId: {
            _id: string;
            itemName: string;
            serialNumber: string;
            baseRentalPrice: number;
        };
        quantity: number;
    }>;
    rentalDate: string;
    dueDate: string;
    returnDate?: string;
    status: 'Rented' | 'Returned' | 'Overdue';
    totalAmount: number;
    paymentStatus: 'Paid' | 'Pending' | 'Partial';
    notes?: string;
}
 
export default Rental;