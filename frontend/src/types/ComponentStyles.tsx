export interface ComponentStyles {
    [key: string]: React.CSSProperties; 
}

export interface StyleDictionaryEntry {
    mobile: ComponentStyles;
    desktop: ComponentStyles;
}