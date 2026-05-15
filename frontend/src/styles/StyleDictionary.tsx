import {
    AdminStyles,
    AddUpdateRentalStyles,
    ProductRentalsStyles,
    InventoryPageStyles,
    CustomersPageStyles,
    UsersPageStyles,
    InvoicePageStyles,
    RentalPageStyles,
    StatsPageStyles,
    LoginStyles,
    ModalStyles,
    FormStyles,
    CardStyles,
    StatusBadge,
} from './AllStyles';

export const styleDictionary = new Map<string, object>();

styleDictionary.set('adminLayout',     AdminStyles);
styleDictionary.set('addUpdateRentals', AddUpdateRentalStyles);
styleDictionary.set('productRentals',  ProductRentalsStyles);
styleDictionary.set('inventory',       InventoryPageStyles);
styleDictionary.set('customers',       CustomersPageStyles);
styleDictionary.set('users',           UsersPageStyles);
styleDictionary.set('invoices',        InvoicePageStyles);
styleDictionary.set('studioRentals',   RentalPageStyles);
styleDictionary.set('stats',           StatsPageStyles);
styleDictionary.set('login',           LoginStyles);
styleDictionary.set('modal',           ModalStyles);
styleDictionary.set('form',            FormStyles);
styleDictionary.set('cards',           CardStyles);
styleDictionary.set('status',          StatusBadge);