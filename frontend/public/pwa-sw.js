// Service Worker para PWA das Unidades Labelview
// Versão: 1.0.0

const CACHE_NAME = 'pwa-unidade-v1';
const urlsToCache = [
  '/manifest.json'
];

// Install
self.addEventListener('install', (event) => {
  console.log('[PWA-SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[PWA-SW] Cache opened');
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => console.warn('[PWA-SW] Cache failed:', url))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('[PWA-SW] Activating...');
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch - Network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ===== PUSH NOTIFICATIONS =====

self.addEventListener('push', (event) => {
  console.log('[PWA-SW] Push received:', event);
  
  let data = {
    title: 'Proteção Veicular',
    body: 'Você tem uma nova notificação',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'pwa-notification',
    url: '/'
  };

  // Tentar extrair dados do push
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        url: payload.url || payload.click_url || data.url,
        image: payload.image || payload.imagem_url,
        data: payload.data || {}
      };
    } catch (e) {
      // Se não for JSON, usar texto
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: {
      url: data.url,
      ...data.data
    }
  };

  // Adicionar imagem se existir
  if (data.image) {
    options.image = data.image;
  }

  // Adicionar ações
  options.actions = [
    {
      action: 'open',
      title: 'Ver',
      icon: '/icon-96x96.png'
    },
    {
      action: 'close',
      title: 'Fechar'
    }
  ];

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[PWA-SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Abrir URL da notificação ou URL padrão
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já tiver uma janela aberta, focar nela
        for (const client of clientList) {
          if (client.url.includes('/unidade/') && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Se não, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[PWA-SW] Notification closed');
});

console.log('[PWA-SW] Service Worker loaded - Push Notifications enabled');
