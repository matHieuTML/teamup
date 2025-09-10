import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/auth/firebase-admin-auth'
import { FieldValue } from 'firebase-admin/firestore'

// POST /api/events/[id]/leave - Se désinscrire d'un événement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await requireAuth(request)
    const { id: eventId } = await params
    const userId = decodedToken.uid

    if (!adminDB) {
      throw new Error('Firebase Admin DB non initialisé')
    }

    // Vérifier que l'événement existe
    const eventDoc = await adminDB.collection('events').doc(eventId).get()
    
    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Trouver la participation de l'utilisateur
    const userEventSnapshot = await adminDB
      .collection('userEvents')
      .where('id_user', '==', userId)
      .where('id_event', '==', eventId)
      .get()

    if (userEventSnapshot.empty) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas inscrit à cet événement' },
        { status: 400 }
      )
    }

    const userEventDoc = userEventSnapshot.docs[0]
    const userEventData = userEventDoc.data()

    // Vérifier que l'utilisateur n'est pas l'organisateur
    if (userEventData.role === 'organisateur') {
      return NextResponse.json(
        { error: 'L\'organisateur ne peut pas quitter son propre événement' },
        { status: 400 }
      )
    }

    // Supprimer la participation
    await userEventDoc.ref.delete()

    // Mettre à jour les statistiques de l'utilisateur
    const userRef = adminDB.collection('users').doc(userId)
    await userRef.update({
      number_event_joined: FieldValue.increment(-1)
    })

    return NextResponse.json({
      success: true,
      message: 'Désinscription réussie de l\'événement'
    })

  } catch (error) {
    console.error('Erreur API POST /events/[id]/leave:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
