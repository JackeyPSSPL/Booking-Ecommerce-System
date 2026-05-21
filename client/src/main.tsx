import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppRouter } from './router';
import { ThemeProvider } from './components/theme/theme-provider';
import AosProvider from './components/aos-provider';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <AosProvider>
        <QueryClientProvider client={queryClient}>
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { zIndex: 9999 },
              error: { duration: 5000 },
            }}
          />
        </QueryClientProvider>
      </AosProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
