// Register service worker and handle updates

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('ServiceWorker.js', { scope: window.location })
    .then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (confirm('New version available. Reload now?')) {
              window.location.reload();
            }
          }
        });
      });
    })
    .catch((err) => console.error('Service worker registration failed', err));
}
