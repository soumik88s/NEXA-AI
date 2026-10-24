import { registerSW } from 'virtual:pwa-register';

export function setupServiceWorker() {
  // Only register in production environments to prevent dev-server iframe interception errors
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !import.meta.env.DEV) {
    try {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('[NEXA PWA] New version available');
        },
        onOfflineReady() {
          console.log('[NEXA PWA] App cached and ready for offline operation');
        },
        onRegisterError(error) {
          console.warn('[NEXA PWA] Registration error:', error);
        },
      });
    } catch (e) {
      console.warn('[NEXA PWA] Setup failed:', e);
    }
  }
}
