import { Toaster } from 'sonner';
import { useTheme } from '@/providers/theme-provider';

export const AppToaster = () => {
    const { resolvedTheme } = useTheme();
    return <Toaster theme={resolvedTheme} position="top-center" richColors closeButton toastOptions={{ duration: 4500 }} />;
};
