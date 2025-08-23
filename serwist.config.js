const { defaultCache } = require('@serwist/next/worker')

/** @type {import('@serwist/build').WebpackInjectManifestOptions} */
module.exports = {
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  cacheId: 'teamup-pwa',
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    ...defaultCache,
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firebase-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 300, // 5 minutes
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.googleapis\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-apis',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 86400, // 1 day
        },
      },
    },
  ],
}