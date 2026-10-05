import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import { queryClient } from '@/lib/query-client';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { TooltipProvider } from '@/components/ui/menus';
import { AppToaster } from '@/components/layout/app-toaster';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <TooltipProvider delayDuration={300}>
                        <App />
                        <AppToaster />
                    </TooltipProvider>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    </StrictMode>,
);
