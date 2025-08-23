import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase-admin'
import { SportType, EventVisibility } from '@/types/database'

// GET - Récupérer tous les événements ou un événement spécifique
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    const sportType = searchParams.get('sportType') as SportType
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    if (id) {
      // Récupérer un événement spécifique
      const eventDoc = await adminDB.collection('events').doc(id).get()
      
      if (!eventDoc.exists) {
        return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
      }

      return NextResponse.json({ 
        success: true, 
        event: { id: eventDoc.id, ...eventDoc.data() } 
      })
    } else {
      // Construire la query avec filtres optionnels
      let query = adminDB.collection('events')
        .where('visibility', '==', EventVisibility.PUBLIC)
        .orderBy('date', 'asc')
        .limit(limit)
        .offset(offset)

      // Filtrer par créateur
      if (userId) {
        query = adminDB.collection('events')
          .where('created_by', '==', userId)
          .orderBy('date', 'asc')
          .limit(limit)
          .offset(offset)
      }

      // Filtrer par type de sport
      if (sportType) {
        query = query.where('type', '==', sportType)
      }

      const eventsSnapshot = await query.get()

      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      return NextResponse.json({ success: true, events })
    }
  } catch (error: any) {
    console.error('❌ Erreur GET /api/events:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Créer un nouvel événement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      type, 
      description, 
      level_needed,
      location_name,
      location_id,
      latitude,
      longitude,
      picture_url,
      competent_trainer = false,
      date,
      average_speed,
      distance,
      max_participants,
      created_by,
      visibility = EventVisibility.PUBLIC
    } = body

    // Validation des champs obligatoires
    if (!name || !type || !description || !location_name || !latitude || !longitude || !date || !created_by) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: name, type, description, location_name, latitude, longitude, date, created_by' },
        { status: 400 }
      )
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    // Vérifier que l'utilisateur créateur existe
    const userDoc = await adminDB.collection('users').doc(created_by).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Utilisateur créateur non trouvé' }, { status: 404 })
    }

    const eventData = {
      name,
      type,
      description,
      level_needed,
      location_name,
      location_id,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      picture_url,
      competent_trainer,
      date: new Date(date),
      average_speed: average_speed ? parseFloat(average_speed) : undefined,
      distance: distance ? parseFloat(distance) : undefined,
      max_participants: max_participants ? parseInt(max_participants) : undefined,
      created_by,
      created_at: new Date(),
      updated_at: new Date(),
      visibility
    }

    const docRef = await adminDB.collection('events').add(eventData)

    // Incrémenter le compteur d'événements créés de l'utilisateur
    await adminDB.collection('users').doc(created_by).update({
      number_event_created: adminDB.FieldValue.increment(1),
      updated_at: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Événement créé',
      eventId: docRef.id
    })

  } catch (error: any) {
    console.error('❌ Erreur POST /api/events:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Mettre à jour un événement
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID événement requis' }, { status: 400 })
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    // Vérifier que l'événement existe
    const eventDoc = await adminDB.collection('events').doc(id).get()
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
    }

    // Mettre à jour avec updated_at et conversion des types si nécessaire
    const updatedData = {
      ...updateData,
      updated_at: new Date()
    }

    // Convertir les types numériques si présents
    if (updatedData.latitude) updatedData.latitude = parseFloat(updatedData.latitude)
    if (updatedData.longitude) updatedData.longitude = parseFloat(updatedData.longitude)
    if (updatedData.average_speed) updatedData.average_speed = parseFloat(updatedData.average_speed)
    if (updatedData.distance) updatedData.distance = parseFloat(updatedData.distance)
    if (updatedData.max_participants) updatedData.max_participants = parseInt(updatedData.max_participants)
    if (updatedData.date) updatedData.date = new Date(updatedData.date)

    await adminDB.collection('events').doc(id).update(updatedData)

    return NextResponse.json({ 
      success: true, 
      message: 'Événement mis à jour' 
    })

  } catch (error: any) {
    console.error('❌ Erreur PUT /api/events:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Supprimer un événement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID événement requis' }, { status: 400 })
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    // Vérifier que l'événement existe
    const eventDoc = await adminDB.collection('events').doc(id).get()
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
    }

    const eventData = eventDoc.data()

    // Supprimer l'événement
    await adminDB.collection('events').doc(id).delete()

    // Supprimer toutes les inscriptions associées
    const userEventsSnapshot = await adminDB
      .collection('userEvents')
      .where('id_event', '==', id)
      .get()

    const batch = adminDB.batch()
    userEventsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    // Supprimer tous les messages associés
    const messagesSnapshot = await adminDB
      .collection('messages')
      .where('id_event', '==', id)
      .get()

    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    await batch.commit()

    // Décrémenter le compteur d'événements créés de l'utilisateur
    if (eventData?.created_by) {
      await adminDB.collection('users').doc(eventData.created_by).update({
        number_event_created: adminDB.FieldValue.increment(-1),
        updated_at: new Date()
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Événement supprimé' 
    })

  } catch (error: any) {
    console.error('❌ Erreur DELETE /api/events:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}