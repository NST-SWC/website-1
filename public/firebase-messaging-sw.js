// Firebase Cloud Messaging Service Worker
// This file handles background notifications

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyDiGcCmpBFqjNVhVLvrY-UoGDdQMXYrLAM",
  authDomain: "nst-swc1.firebaseapp.com",
  projectId: "nst-swc1",
  storageBucket: "nst-swc1.firebasestorage.app",
  messagingSenderId: "359641941847",
  appId: "1:359641941847:web:62441008dbf0dead1b6012"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

const broadcastNotificationToClients = (notification) => {
  if (!self.clients || !self.clients.matchAll) return;
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    clientList.forEach((client) => {
      try {
        client.postMessage({
          type: 'PUSH_NOTIFICATION',
          notification,
        });
      } catch (err) {
        console.warn('[firebase-messaging-sw.js] Failed to post message to client', err);
      }
    });
  }).catch((err) => console.warn('[firebase-messaging-sw.js] broadcast error', err));
};

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'DevForge';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/app-icon-192.png',
    badge: '/app-icon-72.png',
    tag: payload.data?.tag || 'notification',
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || '/',
      ...payload.data
    },
    requireInteraction: false,
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : []
  };

  const clientNotification = {
    id: payload.data?.id || payload.messageId || `${payload.sentTime || Date.now()}`,
    title: notificationTitle,
    body: notificationOptions.body,
    url: notificationOptions.data?.url || '/',
    icon: notificationOptions.icon,
    createdAt: new Date().toISOString(),
  };

  broadcastNotificationToClients(clientNotification);
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();

  // Get the URL to open (default to root if not specified)
  const urlToOpen = event.notification.data?.url || '/';

  // This looks to see if the current window is already open and focuses it
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with this URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
  // You can track notification dismissals here
});

console.log('[firebase-messaging-sw.js] Service worker loaded and ready');
