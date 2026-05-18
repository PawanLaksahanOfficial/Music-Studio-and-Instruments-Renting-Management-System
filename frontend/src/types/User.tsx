interface User {
    _id: string;
    name: string;
    username: string;
    email?: string;
    role: 'Admin' | 'Cashier';
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
}
 
export default User;