import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/auth/firebase-admin-auth'

// GET /api/events/[id]/stats - Récupérer les statistiques d'un événement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await requireAuth(request)
    const resolvedParams = await params
    const eventId = resolvedParams.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || decodedToken.uid

    console.log('🔍 [API DEBUG] === STATS API ===')
    console.log('🔍 [API DEBUG] eventId:', eventId)
    console.log('🔍 [API DEBUG] userId:', userId)
    console.log('🔍 [API DEBUG] decodedToken.uid:', decodedToken.uid)

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

    // Récupérer toutes les participations pour cet événement
    const userEventsSnapshot = await adminDB
      .collection('userEvents')
      .where('id_event', '==', eventId)
      .get()

    console.log('🔍 [API DEBUG] userEventsSnapshot.size:', userEventsSnapshot.size)

    let organizer = null
    const participants: any[] = []
    let userRole = null

    // Traiter chaque participation
    for (const doc of userEventsSnapshot.docs) {
      const userEventData = doc.data()
      
      console.log('🔍 [API DEBUG] Processing userEvent:', {
        id_user: userEventData.id_user,
        id_event: userEventData.id_event,
        role: userEventData.role,
        joined_at: userEventData.joined_at
      })
      
      // Récupérer les infos de l'utilisateur
      const userDoc = await adminDB
        .collection('users')
        .doc(userEventData.id_user)
        .get()
      
      const userData = userDoc.exists ? userDoc.data() : null
      
      const participantInfo = {
        id_user: userEventData.id_user,
        id_event: userEventData.id_event,
        role: userEventData.role,
        joined_at: userEventData.joined_at,
        user: userData ? {
          name: userData.name,
          profile_picture_url: userData.profile_picture_url
        } : null
      }

      // Identifier le rôle de l'utilisateur actuel
      console.log('🔍 [API DEBUG] Checking if user matches:', {
        userEventData_id_user: userEventData.id_user,
        userId: userId,
        matches: userEventData.id_user === userId
      })
      
      if (userEventData.id_user === userId) {
        userRole = userEventData.role
        console.log('✅ [API DEBUG] User role found:', userRole)
      }

      // Séparer organisateur et participants
      if (userEventData.role === 'organisateur') {
        organizer = participantInfo
        console.log('👑 [API DEBUG] Organizer found:', userEventData.id_user)
      } else if (userEventData.role === 'participant') {
        participants.push(participantInfo)
        console.log('👥 [API DEBUG] Participant found:', userEventData.id_user)
      }
    }

    // FALLBACK: Si aucun organisateur trouvé mais que l'utilisateur est le créateur de l'événement
    if (!organizer && !userRole) {
      const eventData = eventDoc.data()
      if (eventData && eventData.created_by === userId) {
        console.log('🔧 [API DEBUG] FALLBACK: Utilisateur est le créateur, création de l\'entrée UserEvent organisateur')
        
        // Créer l'entrée UserEvent manquante pour l'organisateur
        const userEventData = {
          id_user: userId,
          id_event: eventId,
          role: 'organisateur',
          joined_at: new Date()
        }
        
        try {
          await adminDB.collection('userEvents').add(userEventData)
          console.log('✅ [API DEBUG] Entrée UserEvent organisateur créée avec succès')
          
          // Récupérer les infos utilisateur pour l'organisateur
          const userDoc = await adminDB.collection('users').doc(userId).get()
          const userData = userDoc.exists ? userDoc.data() : null
          
          organizer = {
            id_user: userId,
            id_event: eventId,
            role: 'organisateur',
            joined_at: userEventData.joined_at,
            user: userData ? {
              name: userData.name,
              profile_picture_url: userData.profile_picture_url
            } : null
          }
          
          userRole = 'organisateur'
          console.log('✅ [API DEBUG] Organisateur défini via fallback')
        } catch (error) {
          console.error('❌ [API DEBUG] Erreur lors de la création de l\'entrée UserEvent:', error)
        }
      }
    }

    console.log('🔍 [API DEBUG] Final results:', {
      userRole,
      organizer: organizer?.id_user,
      participantsCount: participants.length,
      totalUserEvents: userEventsSnapshot.size,
      fallbackUsed: !userEventsSnapshot.size && userRole === 'organisateur'
    })

    const stats = {
      totalParticipants: participants.length + (organizer ? 1 : 0),
      organizer,
      participants,
      userRole
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Erreur API GET /events/[id]/stats:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
