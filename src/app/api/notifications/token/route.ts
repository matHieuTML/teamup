import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDB } from '@/lib/firebase-admin'
import { z } from 'zod'

const tokenSchema = z.object({
  userId: z.string(),
  token: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    if (!adminAuth) {
      return NextResponse.json({ error: 'Service non disponible' }, { status: 503 })
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    const body = await request.json()
    const { userId: requestUserId, token: fcmToken } = tokenSchema.parse(body)

    // Vérifier que l'utilisateur ne peut modifier que son propre token
    if (userId !== requestUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Base de données non disponible' }, { status: 503 })
    }

    // Sauvegarder le token FCM dans Firestore
    await adminDB.collection('users').doc(userId).update({
      fcm_token: fcmToken,
      fcm_token_updated_at: new Date()
    })

    console.log(`FCM token saved for user ${userId}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Token FCM sauvegardé avec succès' 
    })

  } catch (error) {
    console.error('Error saving FCM token:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Erreur lors de la sauvegarde du token FCM' 
    }, { status: 500 })
  }
}
