import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/auth/firebase-admin-auth'

// GET /api/events/[id] - Récupérer un événement par son ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await requireAuth(request)
    const resolvedParams = await params
    const { id: eventId } = resolvedParams

    if (!adminDB) {
      throw new Error('Firebase Admin DB non initialisé')
    }

    // Récupérer l'événement
    const eventDoc = await adminDB.collection('events').doc(eventId).get()
    
    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    const eventData = {
      id: eventDoc.id,
      ...eventDoc.data()
    }

    return NextResponse.json({
      success: true,
      data: eventData
    })

  } catch (error) {
    console.error('Erreur API GET /events/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/events/[id] - Mettre à jour un événement
export async function PUT(
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

    // Vérifier que l'utilisateur est l'organisateur
    const eventDoc = await adminDB.collection('events').doc(eventId).get()
    
    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    const eventData = eventDoc.data()
    if (eventData?.created_by !== userId) {
      return NextResponse.json(
        { error: 'Seul l\'organisateur peut modifier cet événement' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Mettre à jour l'événement
    await adminDB.collection('events').doc(eventId).update({
      ...body,
      updated_at: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Événement mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur API PUT /events/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id] - Supprimer un événement
export async function DELETE(
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

    // Vérifier que l'utilisateur est l'organisateur
    const eventDoc = await adminDB.collection('events').doc(eventId).get()
    
    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    const eventData = eventDoc.data()
    if (eventData?.created_by !== userId) {
      return NextResponse.json(
        { error: 'Seul l\'organisateur peut supprimer cet événement' },
        { status: 403 }
      )
    }

    // Supprimer l'événement et toutes les participations associées
    const batch = adminDB.batch()
    
    // Supprimer l'événement
    batch.delete(adminDB.collection('events').doc(eventId))
    
    // Supprimer toutes les participations
    const userEventsSnapshot = await adminDB
      .collection('userEvents')
      .where('id_event', '==', eventId)
      .get()
    
    userEventsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    // Supprimer tous les messages
    const messagesSnapshot = await adminDB
      .collection('messages')
      .where('id_event', '==', eventId)
      .get()
    
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    await batch.commit()

    return NextResponse.json({
      success: true,
      message: 'Événement supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur API DELETE /events/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
