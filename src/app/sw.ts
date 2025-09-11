// Service Worker basique pour TeamUp PWA
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope

// Installation du SW
sw.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker: Installation')
  sw.skipWaiting()
})

// Activation du SW
sw.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service Worker: Activation')
  event.waitUntil(sw.clients.claim())
})

// Cache basique pour les assets
sw.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})