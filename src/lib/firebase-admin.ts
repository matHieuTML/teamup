import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Configuration Firebase Admin SDK
const firebaseAdminConfig = {
  type: "service_account",
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
  private_key_id: "",
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
  auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
  token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_CERT_URL,
}

// Initialiser Firebase Admin uniquement côté serveur
let adminApp
if (typeof window === 'undefined') {
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(firebaseAdminConfig as any),
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    }, 'admin')
  } else {
    adminApp = getApps().find(app => app.name === 'admin')
  }
}

export const adminDB = adminApp ? getFirestore(adminApp) : null
export { adminApp }