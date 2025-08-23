import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase-admin'
import { UserEventRole } from '@/types/database'

// GET - Récupérer les inscriptions (utilisateurs d'un événement ou événements d'un utilisateur)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!eventId && !userId) {
      return NextResponse.json({ error: 'ID événement ou ID utilisateur requis' }, { status: 400 })
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    let query = adminDB.collection('userEvents')
      .limit(limit)
      .offset(offset)

    if (eventId) {
      // Récupérer tous les participants d'un événement
      query = query.where('id_event', '==', eventId)
      
      const userEventsSnapshot = await query.get()
      const participants = []
      
      // Enrichir avec les données utilisateur
      for (const doc of userEventsSnapshot.docs) {
        const userEventData = doc.data()
        const userDoc = await adminDB.collection('users').doc(userEventData.id_user).get()
        
        participants.push({
          id: doc.id,
          ...userEventData,
          user: userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null
        })
      }
      
      return NextResponse.json({ success: true, participants })
    }

    if (userId) {
      // Récupérer tous les événements d'un utilisateur
      query = query.where('id_user', '==', userId)
      
      const userEventsSnapshot = await query.get()
      const events = []
      
      // Enrichir avec les données événement
      for (const doc of userEventsSnapshot.docs) {
        const userEventData = doc.data()
        const eventDoc = await adminDB.collection('events').doc(userEventData.id_event).get()
        
        events.push({
          id: doc.id,
          ...userEventData,
          event: eventDoc.exists ? { id: eventDoc.id, ...eventDoc.data() } : null
        })
      }
      
      return NextResponse.json({ success: true, events })
    }

  } catch (error: any) {
    console.error('❌ Erreur GET /api/userEvents:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - S'inscrire à un événement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id_user, id_event, role = UserEventRole.PARTICIPANT } = body

    // Validation des champs obligatoires
    if (!id_user || !id_event) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: id_user, id_event' },
        { status: 400 }
      )
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    // Vérifier que l'utilisateur existe
    const userDoc = await adminDB.collection('users').doc(id_user).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier que l'événement existe
    const eventDoc = await adminDB.collection('events').doc(id_event).get()
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existingRegistration = await adminDB
      .collection('userEvents')
      .where('id_user', '==', id_user)
      .where('id_event', '==', id_event)
      .get()

    if (!existingRegistration.empty) {
      return NextResponse.json({ error: 'Utilisateur déjà inscrit à cet événement' }, { status: 409 })
    }

    // Vérifier la limite de participants si définie
    const eventData = eventDoc.data()
    if (eventData?.max_participants) {
      const currentParticipants = await adminDB
        .collection('userEvents')
        .where('id_event', '==', id_event)
        .get()
      
      if (currentParticipants.size >= eventData.max_participants) {
        return NextResponse.json({ error: 'Événement complet' }, { status: 409 })
      }
    }

    // Déterminer le rôle - si c'est le créateur, il devient organisateur
    let finalRole = role
    if (eventData?.created_by === id_user) {
      finalRole = UserEventRole.ORGANISATEUR
    }

    const userEventData = {
      id_user,
      id_event,
      role: finalRole,
      joined_at: new Date()
    }

    const docRef = await adminDB.collection('userEvents').add(userEventData)

    // Incrémenter le compteur d'événements rejoints de l'utilisateur
    await adminDB.collection('users').doc(id_user).update({
      number_event_joined: adminDB.FieldValue.increment(1),
      updated_at: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Inscription réussie',
      userEventId: docRef.id
    })

  } catch (error: any) {
    console.error('❌ Erreur POST /api/userEvents:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Modifier le rôle d'un participant (seulement par l'organisateur)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, role, requesterId } = body

    if (!id || !role || !requesterId) {
      return NextResponse.json({ error: 'ID inscription, rôle et ID demandeur requis' }, { status: 400 })
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    // Vérifier que l'inscription existe
    const userEventDoc = await adminDB.collection('userEvents').doc(id).get()
    if (!userEventDoc.exists) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }

    const userEventData = userEventDoc.data()

    // Vérifier que l'événement existe et récupérer les infos
    const eventDoc = await adminDB.collection('events').doc(userEventData?.id_event).get()
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
    }

    const eventData = eventDoc.data()

    // Vérifier que le demandeur est l'organisateur de l'événement
    if (eventData?.created_by !== requesterId) {
      return NextResponse.json({ error: 'Seul l\'organisateur peut modifier les rôles' }, { status: 403 })
    }

    // Mettre à jour le rôle
    await adminDB.collection('userEvents').doc(id).update({
      role,
      updated_at: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Rôle modifié' 
    })

  } catch (error: any) {
    console.error('❌ Erreur PUT /api/userEvents:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Se désinscrire d'un événement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const eventId = searchParams.get('eventId')

    if (!userId || !eventId) {
      return NextResponse.json({ error: 'ID utilisateur et ID événement requis' }, { status: 400 })
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    // Trouver l'inscription
    const userEventSnapshot = await adminDB
      .collection('userEvents')
      .where('id_user', '==', userId)
      .where('id_event', '==', eventId)
      .get()

    if (userEventSnapshot.empty) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }

    const userEventDoc = userEventSnapshot.docs[0]
    const userEventData = userEventDoc.data()

    // Vérifier si l'utilisateur est l'organisateur
    const eventDoc = await adminDB.collection('events').doc(eventId).get()
    if (eventDoc.exists && eventDoc.data()?.created_by === userId) {
      return NextResponse.json({ 
        error: 'L\'organisateur ne peut pas se désinscrire de son propre événement' 
      }, { status: 409 })
    }

    // Supprimer l'inscription
    await adminDB.collection('userEvents').doc(userEventDoc.id).delete()

    // Décrémenter le compteur d'événements rejoints de l'utilisateur
    await adminDB.collection('users').doc(userId).update({
      number_event_joined: adminDB.FieldValue.increment(-1),
      updated_at: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Désinscription réussie' 
    })

  } catch (error: any) {
    console.error('❌ Erreur DELETE /api/userEvents:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}