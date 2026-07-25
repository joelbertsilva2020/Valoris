import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { PortalProvider } from './state/PortalContext';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PortalProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PortalProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
