import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDatabase } from './features/object-detection/db/detectionDb';
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize IndexedDB database (versioning, migration, recovery)
initDatabase().catch(err => {
  console.error('IndexedDB initialization failed:', err);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
