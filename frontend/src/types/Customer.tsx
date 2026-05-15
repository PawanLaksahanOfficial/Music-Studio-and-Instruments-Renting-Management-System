interface Customer {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
    nicOrPassport: string;
    isBlacklisted: boolean;
    createdAt: string;
}

export default Customer;