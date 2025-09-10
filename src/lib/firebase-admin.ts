import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'

// Configuration Firebase Admin SDK centralisée
function getFirebaseAdminConfig() {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  if (!privateKey) {
    throw new Error('FIREBASE_ADMIN_PRIVATE_KEY manquante')
  }

  return {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  }
}

// Initialiser Firebase Admin une seule fois
let adminApp: App | null = null
let adminDB: Firestore | null = null
let adminAuth: Auth | null = null

function initializeFirebaseAdmin() {
  if (typeof window !== 'undefined') {
    return // Côté client uniquement
  }

  if (adminApp) {
    return // Déjà initialisé
  }

  try {
    const config = getFirebaseAdminConfig()
    
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert(config),
        projectId: config.projectId,
      })
    } else {
      adminApp = getApps()[0]
    }

    adminDB = getFirestore(adminApp)
    adminAuth = getAuth(adminApp)
    
    console.log('✅ Firebase Admin SDK initialisé avec succès')
  } catch (error) {
    console.error('❌ Erreur initialisation Firebase Admin:', error)
    throw error
  }
}

// Initialiser au chargement du module
initializeFirebaseAdmin()

export { adminApp, adminDB, adminAuth, initializeFirebaseAdmin }