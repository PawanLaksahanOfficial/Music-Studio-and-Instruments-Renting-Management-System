import { useEffect } from 'react';

export const useDocumentTitle = (title: string) => {
    useEffect(() => {
        document.title = title ? `${title} · ELVI Music Studio` : 'ELVI Music Studio';
    }, [title]);
};
