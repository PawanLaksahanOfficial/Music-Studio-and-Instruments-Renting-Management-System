interface Rental {
    _id: string;
    rentalId: string;
    customer: { 
        _id: string;
        firstName: string; 
        lastName: string 
    };
    items: Array<{ 
        itemId: { 
            _id: string;
            itemName: string 
        } 
    }>;
    rentalDate: string;
    dueDate: string;
    status: string;
    totalAmount: number;
    paymentStatus: string;
}

export default Rental;