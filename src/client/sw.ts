import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Activate a new service worker as soon as it installs, so deploys take
// effect on the next reload instead of waiting for every tab to close.
self.skipWaiting();
clientsClaim();

self.addEventListener('push', event => {
  if (!event.data) return;
  const { title, body } = event.data.json() as { title: string; body: string };
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'dashboard-alert',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
