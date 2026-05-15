interface StudioRental {
    _id: string;
    bookingId: string;
    customer: {
        _id: string;
        firstName: string;
        lastName: string;
        phone: string;
    };
    roomName: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    totalAmount: number;
    status: 'Confirmed' | 'Cancelled' | 'Completed';
    paymentStatus: 'Paid' | 'Pending';
    notes?: string;
}
 
export default StudioRental;