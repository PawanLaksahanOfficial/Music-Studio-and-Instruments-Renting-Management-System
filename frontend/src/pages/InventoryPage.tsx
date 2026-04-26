import { useContext } from "react";
import { StyleContext } from "../context/StyleContext";

export const InventoryPage: React.FC = () => {
    const stylesContext = useContext(StyleContext);
    const styles= stylesContext.getComponentStyle("inventory");

    return (
        <>
            <div style={styles.wrapper}>This is Inventory page Page</div>
        </>
    )
}