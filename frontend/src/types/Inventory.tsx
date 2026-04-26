interface Inventory {
    _id: string;
    itemName: string;
    serialNumber: string;
    status: 'Available' | 'Rented' | 'Maintenance';
}

export default Inventory;