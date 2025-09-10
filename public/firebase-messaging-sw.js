// Firebase Cloud Messaging Service Worker
// Ce fichier doit être dans le dossier public pour être accessible à la racine

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuration Firebase (même que dans firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBoYF9RDWynOZTj6Wl6gwAQszKQUcjJ6aA",
  authDomain: "teamup-75a27.firebaseapp.com",
  projectId: "teamup-75a27",
  storageBucket: "teamup-75a27.firebasestorage.app",
  messagingSenderId: "929173722860",
  appId: "1:929173722860:web:e3e9c1258fa38d2e88f7c9",
  measurementId: "G-GTP4F4C7XS"
};

// Initialiser Firebase dans le service worker
firebase.initializeApp(firebaseConfig);

// Récupérer l'instance de messaging
const messaging = firebase.messaging();

// Gérer les notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('FCM: Background message received', payload);

  const notificationTitle = payload.notification?.title || 'TeamUp';
  const notificationOptions = {
    body: payload.notification?.body || 'Nouvelle notification',
    icon: payload.notification?.icon || '/images/logo/teamup-logo-192.png',
    badge: '/images/logo/teamup-logo-96.png',
    tag: payload.data?.tag || 'teamup-notification',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/images/logo/teamup-logo-96.png'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ],
    requireInteraction: false,
    silent: false
  };

  // Afficher la notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('FCM: Notification clicked', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Action par défaut ou action 'open'
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Vérifier si une fenêtre TeamUp est déjà ouverte
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (urlToOpen !== '/') {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      
      // Ouvrir une nouvelle fenêtre si aucune n'est ouverte
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin + urlToOpen);
      }
    })
  );
});

// Gérer les erreurs de notification
self.addEventListener('notificationerror', (event) => {
  console.error('FCM: Notification error', event);
});

console.log('🔔 Firebase Messaging Service Worker loaded successfully');
