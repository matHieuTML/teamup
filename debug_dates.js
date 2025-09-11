// Script de diagnostic des formats de date
console.log('=== DIAGNOSTIC DES FORMATS DE DATE ===');

// Ancien événement (fonctionne)
const ancienEvent = {
  id: 'CNnE7cMdIbOP4sEbNgk4',
  name: 'ben 10 football',
  date: '2025-09-13T15:03:00.000Z'  // Format ISO string
};

// Nouveau événement (problème)
const nouveauEvent = {
  id: 'ESMSAqAfeJzb9jTZWcHk', 
  name: 'Marathon de Paris',
  date: { _seconds: 1757770200, _nanoseconds: 0 }  // Format Firestore Timestamp
};

console.log('\n--- ANCIEN ÉVÉNEMENT (fonctionne) ---');
console.log('Format en base:', typeof ancienEvent.date, ancienEvent.date);
const ancienDate = new Date(ancienEvent.date);
console.log('Date convertie:', ancienDate.toISOString());
console.log('Affichage EventCard:', ancienDate.toLocaleDateString('fr-FR', { 
  weekday: 'short', 
  day: 'numeric', 
  month: 'short',
  timeZone: 'Europe/Paris'
}) + ' à ' + ancienDate.toLocaleTimeString('fr-FR', { 
  hour: '2-digit', 
  minute: '2-digit',
  timeZone: 'Europe/Paris'
}));

console.log('\n--- NOUVEAU ÉVÉNEMENT (problème) ---');
console.log('Format en base:', typeof nouveauEvent.date, nouveauEvent.date);
const nouveauDate = new Date(nouveauEvent.date._seconds * 1000);
console.log('Date convertie:', nouveauDate.toISOString());
console.log('Affichage EventCard:', nouveauDate.toLocaleDateString('fr-FR', { 
  weekday: 'short', 
  day: 'numeric', 
  month: 'short',
  timeZone: 'Europe/Paris'
}) + ' à ' + nouveauDate.toLocaleTimeString('fr-FR', { 
  hour: '2-digit', 
  minute: '2-digit',
  timeZone: 'Europe/Paris'
}));

console.log('\n--- COMPARAISON ---');
console.log('Même date finale?', ancienDate.toISOString() === nouveauDate.toISOString());
console.log('Différence de format en base: STRING vs TIMESTAMP');

// Test de la fonction convertFirestoreDate AMÉLIORÉE
function convertFirestoreDate(firestoreDate) {
  if (!firestoreDate) {
    console.log('🔍 convertFirestoreDate - date vide, retour new Date()')
    return new Date()
  }
  
  // Si c'est déjà un objet Date
  if (firestoreDate instanceof Date) {
    console.log('🔍 convertFirestoreDate - déjà un objet Date')
    return firestoreDate
  }
  
  // Si c'est un timestamp Firestore avec seconds
  if (firestoreDate && typeof firestoreDate === 'object' && 'seconds' in firestoreDate) {
    console.log('🔍 convertFirestoreDate - Timestamp Firestore avec seconds:', firestoreDate.seconds)
    return new Date(firestoreDate.seconds * 1000)
  }
  
  // Si c'est un objet avec _seconds (autre format Firestore)
  if (firestoreDate && typeof firestoreDate === 'object' && '_seconds' in firestoreDate) {
    console.log('🔍 convertFirestoreDate - Timestamp Firestore avec _seconds:', firestoreDate._seconds)
    return new Date(firestoreDate._seconds * 1000)
  }
  
  // Si c'est une string ISO
  if (typeof firestoreDate === 'string') {
    console.log('🔍 convertFirestoreDate - string ISO:', firestoreDate)
    return new Date(firestoreDate)
  }
  
  // Si c'est un nombre (timestamp en millisecondes)
  if (typeof firestoreDate === 'number') {
    console.log('🔍 convertFirestoreDate - nombre timestamp:', firestoreDate)
    return new Date(firestoreDate)
  }
  
  // Fallback
  console.log('🔍 convertFirestoreDate - fallback conversion directe')
  try {
    return new Date(firestoreDate)
  } catch (error) {
    console.error('🔍 convertFirestoreDate - erreur fallback:', error)
    return new Date()
  }
}

console.log('\n--- TEST FONCTION convertFirestoreDate AMÉLIORÉE ---');
const ancienConverti = convertFirestoreDate(ancienEvent.date);
const nouveauConverti = convertFirestoreDate(nouveauEvent.date);

console.log('Ancien converti:', ancienConverti.toISOString());
console.log('Nouveau converti:', nouveauConverti.toISOString());

console.log('\n--- TEST AFFICHAGE EVENTCARD UNIFORME ---');
// Test avec la même logique que EventCard
function formatEventCardDate(date) {
  const eventDate = convertFirestoreDate(date);
  return eventDate.toLocaleDateString('fr-FR', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short',
    timeZone: 'Europe/Paris'
  }) + ' à ' + eventDate.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  });
}

console.log('Ancien événement - Affichage uniforme:', formatEventCardDate(ancienEvent.date));
console.log('Nouveau événement - Affichage uniforme:', formatEventCardDate(nouveauEvent.date));

console.log('\n=== RÉSULTAT ===');
console.log('✅ La fonction convertFirestoreDate gère maintenant TOUS les formats:');
console.log('   - String ISO (anciens événements)');
console.log('   - Timestamp Firestore avec _seconds (nouveaux événements)');
console.log('   - Timestamp Firestore avec seconds');
console.log('   - Objets Date natifs');
console.log('   - Nombres (timestamps)');
console.log('✅ L\'affichage sera désormais cohérent sur toutes les pages');
