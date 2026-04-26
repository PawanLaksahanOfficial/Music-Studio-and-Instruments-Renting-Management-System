import InventoryPage from "../styles/InventoryPage";
import AddUpdateRentalStyles from "./AddUpdateRentalStyles";
import AdminStyles from "./AdminStyles";
import ProductRentalsStyles from "./ProductRentalsStyles";

export const styleDictionary = new Map();

styleDictionary.set("inventory", InventoryPage);
styleDictionary.set("adminLayout", AdminStyles);
styleDictionary.set("productRentals", ProductRentalsStyles);
styleDictionary.set("addUpdateRentals", AddUpdateRentalStyles);