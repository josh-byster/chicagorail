/**
 * Application entry point
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from '@/app/providers';
import { syncThemeWithSystem } from '@/lib/theme';
import App from './App';
import './index.css';

syncThemeWithSystem();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
);
