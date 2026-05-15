interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}
 
interface Invoice {
    _id: string;
    invoiceId: string;
    customer: {
        _id: string;
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
    };
    productRentals?: {
        _id: string;
        rentalId: string;
    }[];
    studioRentals?: {
        _id: string;
        bookingId: string;
    }[];
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    totalAmount: number;
    paymentMethod: 'Cash' | 'Card' | 'Transfer';
    paymentStatus: 'Paid' | 'Pending';
    createdBy: {
        _id: string;
        name: string;
    };
    notes?: string;
    createdAt: string;
}
 
export type { InvoiceItem };
export default Invoice;
