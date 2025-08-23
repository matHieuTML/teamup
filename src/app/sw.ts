// Service Worker basique pour TeamUp PWA
declare const self: ServiceWorkerGlobalScope

// Installation du SW
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation')
  self.skipWaiting()
})

// Activation du SW
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation')
  event.waitUntil(self.clients.claim())
})

// Cache basique pour les assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})