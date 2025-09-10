import { NextRequest, NextResponse } from 'next/server'
import { initializeFirebaseAdmin, adminAuth, adminDB } from '@/lib/firebase-admin'
import { z } from 'zod'

// Initialiser Firebase Admin avec le module centralisé
initializeFirebaseAdmin()

// Schéma de validation pour l'URL de l'image
const profilePictureSchema = z.object({
  picture_url: z.string().url('URL d\'image invalide')
})

// Fonction d'authentification réutilisable
async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token d\'authentification requis')
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin non initialisé')
    }
    const decodedToken = await adminAuth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error('Erreur de vérification du token:', error)
    throw new Error('Token invalide')
  }
}

// POST /api/profile/picture - Mettre à jour la photo de profil
export async function POST(request: NextRequest) {
  try {
    const decodedToken = await requireAuth(request)

    const userId = decodedToken.uid

    // Validation des données
    const body = await request.json()
    const validationResult = profilePictureSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'URL d\'image invalide',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const { picture_url } = validationResult.data

    try {
      if (!adminDB) {
        throw new Error('Firebase Admin DB non initialisé')
      }

      // Mise à jour directe dans Firestore
      const userRef = adminDB.collection('users').doc(userId)
      await userRef.update({
        profile_picture_url: picture_url,
        updated_at: new Date()
      })

      return NextResponse.json({
        success: true,
        data: {
          picture_url,
          updated_at: new Date().toISOString()
        },
        message: 'Photo de profil mise à jour avec succès'
      })

    } catch (serviceError) {
      console.error('Erreur service mise à jour photo:', serviceError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la photo de profil' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erreur API profile picture POST:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE /api/profile/picture - Supprimer la photo de profil
export async function DELETE(request: NextRequest) {
  try {
    const decodedToken = await requireAuth(request)
    const userId = decodedToken.uid

    try {
      if (!adminDB) {
        throw new Error('Firebase Admin DB non initialisé')
      }

      // Suppression directe dans Firestore
      const userRef = adminDB.collection('users').doc(userId)
      await userRef.update({
        profile_picture_url: null,
        updated_at: new Date()
      })

      return NextResponse.json({
        success: true,
        message: 'Photo de profil supprimée avec succès'
      })

    } catch (serviceError) {
      console.error('Erreur service suppression photo:', serviceError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la photo de profil' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erreur API profile picture DELETE:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}