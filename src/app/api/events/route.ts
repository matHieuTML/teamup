import { NextRequest, NextResponse } from 'next/server'
import { adminDB, initializeFirebaseAdmin } from '@/lib/firebase-admin'
import { SportType, EventVisibility } from '@/types/database'
import { FieldValue } from 'firebase-admin/firestore'

// Initialiser Firebase Admin
initializeFirebaseAdmin()

// GET - Récupérer tous les événements ou un événement spécifique
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    const sportType = searchParams.get('sportType') as SportType
    const limit = parseInt(searchParams.get('limit') || '20')

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
      let events: Array<{ id: string; visibility?: string; type?: string; date?: any; created_by?: string; [key: string]: any }> = []

      if (userId) {
        // Requête simple pour les événements d'un utilisateur spécifique
        // Évite l'index composite en ne faisant qu'un seul filtre
        const eventsSnapshot = await adminDB
          .collection('events')
          .where('created_by', '==', userId)
          .get()

        events = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Trier côté serveur par date
        events.sort((a, b) => {
          const dateA = a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date || 0)
          const dateB = b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date || 0)
          return dateA.getTime() - dateB.getTime()
        })
      } else {
        // Requête pour tous les événements publics avec filtrage conditionnel
        const finalQuery = sportType 
          ? adminDB.collection('events').where('type', '==', sportType).orderBy('date', 'asc').limit(limit * 2)
          : adminDB.collection('events').orderBy('date', 'asc').limit(limit * 2)
        const eventsSnapshot = await finalQuery.get()

        events = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Filtrer côté serveur pour les événements publics
        events = events.filter(event => event.visibility === EventVisibility.PUBLIC || event.visibility === 'public')
      }

      // Enrichir avec le nombre de participants réel et leurs données
      const eventsWithParticipants = await Promise.all(
        events.map(async (event) => {
          try {
            // Récupérer les participants pour cet événement
            const participantsSnapshot = await adminDB!
              .collection('userEvents')
              .where('id_event', '==', event.id)
              .get()
            
            // Récupérer les données des participants (max 3 pour les avatars)
            const participantsData = []
            const participantsDocs = participantsSnapshot.docs.slice(0, 3)
            
            for (const doc of participantsDocs) {
              const userEventData = doc.data()
              try {
                const userDoc = await adminDB!.collection('users').doc(userEventData.id_user).get()
                if (userDoc.exists) {
                  const userData = userDoc.data()
                  participantsData.push({
                    id: userEventData.id_user,
                    name: userData?.name || userData?.displayName || 'Utilisateur',
                    role: userEventData.role,
                    profile_picture_url: userData?.profile_picture_url || null
                  })
                }
              } catch (userError) {
                console.error(`Erreur récupération utilisateur ${userEventData.id_user}:`, userError)
              }
            }
            
            return {
              ...event,
              participants_count: participantsSnapshot.size,
              participants: participantsData
            }
          } catch (error) {
            console.error(`Erreur comptage participants pour événement ${event.id}:`, error)
            return {
              ...event,
              participants_count: 0,
              participants: []
            }
          }
        })
      )

      // Limiter après enrichissement
      const finalEvents = eventsWithParticipants.slice(0, limit)
      const total = finalEvents.length
      const hasMore = finalEvents.length === limit

      return NextResponse.json({ 
        success: true, 
        data: {
          events: finalEvents,
          total,
          hasMore
        }
      })
    }
  } catch (error: unknown) {
    console.error('❌ Erreur GET /api/events:', error)
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur'
    return NextResponse.json({ error: message }, { status: 500 })
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

    // Construire l'objet eventData en filtrant les valeurs undefined
    const eventData: any = {
      name,
      type,
      description,
      location_name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      competent_trainer,
      date: new Date(date),
      created_by,
      created_at: new Date(),
      updated_at: new Date(),
      visibility
    }

    // Ajouter les champs optionnels seulement s'ils ne sont pas undefined
    if (level_needed) eventData.level_needed = level_needed
    if (location_id) eventData.location_id = location_id
    if (picture_url) eventData.picture_url = picture_url
    if (average_speed) eventData.average_speed = parseFloat(average_speed)
    if (distance) eventData.distance = parseFloat(distance)
    if (max_participants) eventData.max_participants = parseInt(max_participants)

    const docRef = await adminDB.collection('events').add(eventData)
    const eventId = docRef.id

    // Créer automatiquement l'entrée UserEvent pour l'organisateur
    // Selon la structure: Table UserEvent { id_user, id_event, role, joined_at }
    const userEventData = {
      id_user: created_by,
      id_event: eventId,
      role: 'organisateur',
      joined_at: new Date()
    }

    await adminDB.collection('userEvents').add(userEventData)

    // Incrémenter le compteur d'événements créés de l'utilisateur
    await adminDB.collection('users').doc(created_by).update({
      number_event_created: FieldValue.increment(1),
      updated_at: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Événement créé avec succès',
      eventId: eventId
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'événement' },
      { status: 500 }
    )}
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
    const updateFields: Record<string, unknown> = {
      ...updateData,
      updated_at: new Date()
    }

    // Convertir les types numériques si présents
    if (updateFields.latitude && typeof updateFields.latitude === 'string') {
      updateFields.latitude = parseFloat(updateFields.latitude)
    }
    if (updateFields.longitude && typeof updateFields.longitude === 'string') {
      updateFields.longitude = parseFloat(updateFields.longitude)
    }
    if (updateFields.average_speed && typeof updateFields.average_speed === 'string') {
      updateFields.average_speed = parseFloat(updateFields.average_speed)
    }
    if (updateFields.distance && typeof updateFields.distance === 'string') {
      updateFields.distance = parseFloat(updateFields.distance)
    }
    if (updateFields.max_participants && typeof updateFields.max_participants === 'string') {
      updateFields.max_participants = parseInt(updateFields.max_participants)
    }
    if (updateFields.date && (typeof updateFields.date === 'string' || typeof updateFields.date === 'number')) {
      updateFields.date = new Date(updateFields.date)
    }

    await adminDB.collection('events').doc(id).update(updateFields)

    return NextResponse.json({ 
      success: true, 
      message: 'Événement mis à jour' 
    })

  } catch (error) {
    console.error('Erreur API events:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )}
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
        number_event_created: FieldValue.increment(-1),
        updated_at: new Date()
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Événement supprimé' 
    })

  } catch (error: unknown) {
    console.error('❌ Erreur DELETE /api/events:', error)
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}