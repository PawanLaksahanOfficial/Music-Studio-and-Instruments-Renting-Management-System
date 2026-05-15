import { ReactNode } from 'react';
import { StyleContext } from '../context/StyleContext';
import { styleDictionary } from '../styles/StyleDictionary';
import { AdminStyles } from '../styles/AllStyles';

export const StyleContextProvider = ({ children }: { children: ReactNode }) => {
    const getComponentStyle = (component: string): Record<string, React.CSSProperties> => {
        const styles = styleDictionary.get(component);
        if (!styles) return {};

        // For adminLayout, merge mobile + desktop for simplicity
        if (component === 'adminLayout') {
            const s = styles as typeof AdminStyles;
            return { ...s } as Record<string, React.CSSProperties>;
        }

        return styles as Record<string, React.CSSProperties>;
    };

    return (
        <StyleContext.Provider value={{ getComponentStyle }}>
            {children}
        </StyleContext.Provider>
    );
};