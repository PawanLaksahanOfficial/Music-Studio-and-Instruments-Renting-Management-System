interface Inventory {
    _id: string;
    itemName: string;
    category: 'Instruments' | 'Audio Gear' | 'Cables' | 'Other';
    brand?: string;
    model?: string;
    serialNumber: string;
    qrCodeId: string;
    status: 'Available' | 'Rented' | 'Maintenance' | 'Damaged' | 'Lost';
    baseRentalPrice: number;
    purchaseDate?: string;
    lastMaintenance?: string;
    notes?: string;
}
 
export default Inventory;
