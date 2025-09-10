import { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

/**
 * Vérifie le token d'authentification Firebase depuis une requête
 */
export async function verifyAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token d\'authentification requis')
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth non initialisé')
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error('Erreur de vérification du token:', error)
    throw new Error('Token invalide')
  }
}

/**
 * Middleware d'authentification pour les API routes
 */
export async function requireAuth(request: NextRequest) {
  try {
    const decodedToken = await verifyAuthToken(request)
    return decodedToken
  } catch (error) {
    throw error
  }
}