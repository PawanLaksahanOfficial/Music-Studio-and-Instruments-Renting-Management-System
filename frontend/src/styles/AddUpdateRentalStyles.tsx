const AddUpdateRentalStyles = {
  mobile: {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: '#fff',
      borderTopLeftRadius: '20px',
      borderTopRightRadius: '20px',
      width: '100%',
      maxHeight: '95vh',
      overflowY: 'auto',
      padding: '20px',
      boxShadow: '0 -5px 15px rgba(0,0,0,0.1)',
    },
    formGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginTop: '15px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    label: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#34495e',
    },
    input: {
      padding: '14px',
      borderRadius: '8px',
      border: '1px solid #dcdde1',
      fontSize: '16px',
      backgroundColor: '#f9f9f9',
    },
    buttonGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginTop: '25px',
    },
    cancelButton: {
      padding: '14px',
      borderRadius: '8px',
      border: '1px solid #dcdde1',
      backgroundColor: '#fff',
      fontSize: '16px',
      fontWeight: 500,
      order: 2,
    },
    submitButton: {
      padding: '14px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#3498db',
      color: '#fff',
      fontSize: '16px',
      fontWeight: 600,
      order: 1,
    }
  },

  desktop: {
    modalOverlay: {
      alignItems: 'center', 
    },
    modalContent: {
      borderRadius: '12px',
      width: '600px',
      padding: '30px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
    },
    input: {
      padding: '10px',
      fontSize: '14px',
    },
    buttonGroup: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: '30px',
    },
    cancelButton: {
      padding: '10px 25px',
      width: 'auto',
      order: 1,
    },
    submitButton: {
      padding: '10px 25px',
      width: 'auto',
      order: 2,
    }
  }
};

export default AddUpdateRentalStyles;