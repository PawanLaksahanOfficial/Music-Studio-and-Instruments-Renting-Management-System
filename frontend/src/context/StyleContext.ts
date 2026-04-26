import { createContext } from "react";
import type { ComponentStyles } from "../types/ComponentStyles";

export interface StyleContextType {
    getComponentStyle(component: string): ComponentStyles;
}

export const StyleContext = createContext<StyleContextType>({
    getComponentStyle: () => ({})
});