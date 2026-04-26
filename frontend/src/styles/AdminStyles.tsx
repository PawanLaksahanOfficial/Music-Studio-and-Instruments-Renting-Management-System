const AdminStyles = {
    mobile: {
        container: { display: "block", minHeight: "100vh" },
        sidebar: { backgroundColor: "#2c3e50", color: "white", display: "none" },
        main: { width: "100%", padding: "10px", backgroundColor: "#f4f7f6" },
        grid: { overflowX: "auto" },
        table: { width: "100%", borderCollapse: "collapse", marginTop: "20px" },
        th: { 
            textAlign: "left" as const, 
            padding: "12px", 
            borderBottom: "2px solid #ddd", 
            backgroundColor: "#eee",
            color: "#333"
        },
        td: { padding: "12px", borderBottom: "1px solid #ddd" }
    },
    desktop: {
        container: { display: "flex" },
        sidebar: { width: "250px", display: "block" },
        main: { flex: 1, padding: "30px" }
    }
};

export default AdminStyles;