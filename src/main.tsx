import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupServiceWorker } from './registerServiceWorker';

// Register Workbox PWA service worker for offline/low-connectivity caching
setupServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);
