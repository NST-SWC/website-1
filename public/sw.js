/* Service Worker: public/sw.js
   Handles 'push' and 'notificationclick' events for Web Push.
*/
/* eslint-disable no-restricted-globals */
self.addEventListener('push', (event) => {
  try {
    const payload = event.data ? event.data.json() : {};
    const title = payload.title || 'New notification';
    const options = {
      body: payload.body || undefined,
      // Use the icons available in public/ (SVG assets); these match manifest entries.
      // Prefer providing PNGs for best compatibility, but SVG works in most modern browsers.
      icon: payload.icon || '/icon-192x192.svg',
      badge: payload.badge || '/icon-72x72.svg',
      data: payload.data || {},
      renotify: payload.renotify || false,
      tag: payload.tag || undefined,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // If the payload isn't JSON or another error happens, show a simple notification
    const title = 'New notification';
    event.waitUntil(self.registration.showNotification(title, {}));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === clickUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(clickUrl);
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // In many browsers this rarely fires in practice, but it's here for completeness.
  // Ideally the client re-subscribes and sends the new subscription to the server.
  console.log('pushsubscriptionchange', event);
});

// Allow clients to trigger a skipWaiting to activate this worker immediately.
self.addEventListener('message', (event) => {
  try {
    const data = event.data || {};
    if (data && data.type === 'SKIP_WAITING') {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      self.skipWaiting();
    }
  } catch (err) {
    console.warn('sw message handler error', err);
  }
});
