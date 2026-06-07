import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';
import './lib/i18n';
import App from './App';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
        },
    },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <React.Suspense fallback={<div className="flex h-screen w-screen items-center justify-center">Loading...</div>}>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <AuthProvider>
                        <OrgProvider>
                            <App />
                        </OrgProvider>
                    </AuthProvider>
                </BrowserRouter>
            </QueryClientProvider>
        </React.Suspense>
    </React.StrictMode>
);
