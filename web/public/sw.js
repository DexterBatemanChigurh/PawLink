const CACHE_NAME = 'pawlink-v1'
const PRECACHE_URLS = ['/', '/login', '/explorar']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    }),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    }),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API requests: network-only
  if (url.pathname.startsWith('/api')) {
    return
  }

  // Navigation requests (HTML): network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    )
    return
  }

  // Static assets (JS, CSS, images): cache-first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/) ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
          return response
        })
        return cached || fetchPromise
      }),
    )
    return
  }

  // Everything else: network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request)),
  )
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const { title, body, icon, badge, data: extra } = data

  event.waitUntil(
    self.registration.showNotification(title || 'PawLink', {
      body: body || '',
      icon: icon || '/favicon.svg',
      badge: badge || '/favicon.svg',
      data: extra || {},
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    }),
  )
})
