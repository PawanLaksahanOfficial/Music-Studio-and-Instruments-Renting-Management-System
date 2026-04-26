import React, { useContext} from 'react';
import { StyleContext } from '../context/StyleContext';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const { getComponentStyle } = useContext(StyleContext);
    const styles = getComponentStyle("adminLayout");
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { id: "products", label: "Product Rentals", path: "/admin/products" },
        { id: "studio", label: "Studio Rentals", path: "/admin/studio" },
        { id: "inventory", label: "Inventory", path: "/admin/inventory" },
        { id: "customers", label: "Customers", path: "/admin/customers" },
        { id: "stats", label: "Statistics", path: "/admin/stats" }
    ];

    return (
        <div style={styles.container}>
            <aside style={styles.sidebar}>
                <h3 style={{ padding: '20px' }}>Admin Dashboard</h3>
                <nav>
                    {menuItems.map(item => (
                        <div 
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            style={{ 
                                padding: '15px 20px', 
                                cursor: 'pointer',
                                backgroundColor: location.pathname === item.path ? '#34495e' : 'transparent'
                            }}
                        >
                            {item.label}
                        </div>
                    ))}
                </nav>
            </aside>
            <main style={styles.main}>
                <Outlet /> 
            </main>
        </div>
    );
};

export default AdminPanel;