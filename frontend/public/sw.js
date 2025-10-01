// Service Worker for PWA
const CACHE_NAME = 'mijnzaken-v1';
const RUNTIME_CACHE = 'runtime-cache';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip SSE requests and API calls - always use network
  if (event.request.url.includes('/events') ||
    event.request.url.includes('/api/') ||
    event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let data = {
    title: 'MijnZaken Update',
    body: 'Er is een nieuwe update',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil((async () => {
    try {
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag || 'default',
        requireInteraction: false,
        data: data.data || {},
      });
    } catch (err) {
      // Continue even if notifications are blocked in headless environment
      console.warn('[Service Worker] showNotification failed:', err);
    }
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      client.postMessage({ type: 'TEST_PUSH_SHOWN', payload: data });
    }
  })());
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  event.notification.close();

  // Extract URL from notification data
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil((async () => {
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Notify pages about click
    for (const client of clientList) {
      client.postMessage({ type: 'TEST_PUSH_CLICKED', payload: { url: urlToOpen } });
    }
    // Check if there's already a window open
    for (const client of clientList) {
      if (client.url === urlToOpen && 'focus' in client) {
        return client.focus();
      }
    }
    // If not, open a new window
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  })());
});

// Message hook to simulate push in tests
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'TEST_PUSH') {
    const payload = msg.payload || {
      title: 'Test Notification',
      body: 'This is a test',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: '/' },
    };
    event.waitUntil((async () => {
      try {
        await self.registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon,
          badge: payload.badge,
          tag: payload.tag || 'default',
          requireInteraction: false,
          data: payload.data || {},
        });
      } catch (err) {
        console.warn('[Service Worker] showNotification failed (test):', err);
      }
      const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        client.postMessage({ type: 'TEST_PUSH_SHOWN', payload });
      }
    })());
  }
});
