// Firebase Cloud Messaging Service Worker
// Ce fichier doit être dans le dossier public pour être accessible à la racine

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuration Firebase - Les clés sont récupérées depuis les variables d'environnement côté client
// Cette configuration ne contient que les informations publiques nécessaires
const firebaseConfig = {
  // Configuration sera injectée dynamiquement par le client
  // Pas de clés API hardcodées pour la sécurité
};

// Fonction pour initialiser Firebase avec la config reçue du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    // Initialiser Firebase avec la configuration reçue
    if (!firebase.apps.length) {
      firebase.initializeApp(event.data.config);
      
      // Récupérer l'instance de messaging
      const messaging = firebase.messaging();
      
      // Gérer les notifications en arrière-plan
      messaging.onBackgroundMessage((payload) => {
        console.log('FCM: Background message received', payload);

        const notificationTitle = payload.notification?.title || 'TeamUp';
        const notificationOptions = {
          body: payload.notification?.body || 'Nouvelle notification',
          icon: '/images/logo/android/android-launchericon-192-192.png',
          badge: '/images/logo/android/android-launchericon-96-96.png',
          tag: 'teamup-notification',
          requireInteraction: false,
          silent: false
        };

        // Afficher la notification
        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  }
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('FCM: Notification clicked', event);
  
  event.notification.close();
  
  // Ouvrir ou focus sur l'application
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si l'app est déjà ouverte, la focus
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
