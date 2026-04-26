import React from "react";
import {useMediaQuery} from 'react-responsive' 
import { styleDictionary } from "../styles/StyleDictionary";
import { StyleContext } from "../context/StyleContext";

type StyleGroup = { [key: string]: string | number | undefined };
type ComponentStyle = { [key: string]: StyleGroup };

export const StyleContextProvider = (Props:{ children: React.ReactNode }) => {

    const isMobile = useMediaQuery({ query : "(max-width: 786px)" });
    const handleComponentStyle = (component: string) => {
        const styles = styleDictionary.get(component);
        if (!styles) return {};

        if (isMobile) {
            return styles.mobile;
        } else {
            return Object.keys(styles.mobile).reduce<ComponentStyle>((acc, key) => {
                acc[key] = {
                    ...(styles.mobile[key] as StyleGroup),
                    ...(styles.desktop?.[key] as StyleGroup || {})
                };
                return acc;
            }, {});
        }
    };
    return(
        <StyleContext.Provider value={{
            getComponentStyle: handleComponentStyle
        }}>
            {Props.children}
        </StyleContext.Provider>
    )
}