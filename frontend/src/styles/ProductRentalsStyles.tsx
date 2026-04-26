const ProductRentalsStyles = {
    mobile: {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '20px'
        },
        header: { 
            display: 'flex', 
            flexDirection: 'column' as const, 
            gap: '10px', 
            marginBottom: '10px' 
        },
        actionButton: { 
            width: '100%', 
            padding: '12px',
            backgroundColor: '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
        },
        statusRented: {
            color: '#f39c12',
            fontWeight: 'bold',
            padding: '4px 10px',
            backgroundColor: '#fef5e7',
            borderRadius: '20px',
            fontSize: '13px',
            border: '1px solid #f9e79f'
        },
        statusOverdue: {
            color: '#e74c3c',
            fontWeight: 'bold',
            padding: '4px 10px',
            backgroundColor: '#fdedec',
            borderRadius: '20px',
            fontSize: '13px',
            border: '1px solid #fadbd8'
        },
        paymentPaid: { color: '#27ae60', fontWeight: '500' },
        paymentPending: { color: '#7f8c8d', fontStyle: 'italic' }
    },
    desktop: {
        header: {
            flexDirection: 'row' as const,
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0px'
        },
        actionButton: { 
            width: 'auto', 
            padding: '10px 24px' 
        }
    }
};

export default ProductRentalsStyles;