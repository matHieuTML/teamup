import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/auth/firebase-admin-auth'
import { FieldValue } from 'firebase-admin/firestore'

// POST /api/events/[id]/join - S'inscrire à un événement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await requireAuth(request)
    const resolvedParams = await params
    const eventId = resolvedParams.id
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

    const eventData = eventDoc.data()

    // Vérifier que l'utilisateur n'est pas déjà inscrit
    const existingParticipation = await adminDB
      .collection('userEvents')
      .where('id_user', '==', userId)
      .where('id_event', '==', eventId)
      .get()

    if (!existingParticipation.empty) {
      return NextResponse.json(
        { error: 'Vous êtes déjà inscrit à cet événement' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur n'est pas l'organisateur
    if (eventData?.created_by === userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous inscrire à votre propre événement' },
        { status: 400 }
      )
    }

    // Vérifier la limite de participants si elle existe
    if (eventData?.max_participants) {
      const currentParticipants = await adminDB
        .collection('userEvents')
        .where('id_event', '==', eventId)
        .where('role', '==', 'participant')
        .get()

      if (currentParticipants.size >= eventData.max_participants) {
        return NextResponse.json(
          { error: 'Cet événement est complet' },
          { status: 400 }
        )
      }
    }

    // Créer la participation
    const userEventData = {
      id_user: userId,
      id_event: eventId,
      role: 'participant',
      joined_at: new Date()
    }

    await adminDB.collection('userEvents').add(userEventData)

    // Mettre à jour les statistiques de l'utilisateur
    const userRef = adminDB.collection('users').doc(userId)
    await userRef.update({
      number_event_joined: FieldValue.increment(1)
    })

    return NextResponse.json({
      success: true,
      message: 'Inscription réussie à l\'événement'
    })

  } catch (error) {
    console.error('Erreur API POST /events/[id]/join:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
