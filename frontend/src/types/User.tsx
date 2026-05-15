interface User {
    _id: string;
    name: string;
    username: string;
    role: 'Admin' | 'Cashier';
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
}
 
export default User;