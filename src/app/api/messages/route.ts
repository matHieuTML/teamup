import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!eventId) {
      return NextResponse.json({ error: 'ID événement requis' }, { status: 400 })
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    const messagesSnapshot = await adminDB
      .collection('messages')
      .where('id_event', '==', eventId)
      .limit(limit + offset)
      .get()

    const allMessages = await Promise.all(
      messagesSnapshot.docs.map(async (doc) => {
        const messageData = doc.data()
        
        let userData = null
        if (messageData.id_user) {
          try {
            const userDoc = await adminDB!.collection('users').doc(messageData.id_user).get()
            if (userDoc.exists) {
              const user = userDoc.data()
              userData = {
                name: user?.name || user?.first_name || 'Utilisateur',
                profile_picture_url: user?.profile_picture_url || null
              }
            }
          } catch (error) {
            console.warn('Erreur lors de la récupération des données utilisateur:', error)
          }
        }

        return {
          id: doc.id,
          ...messageData,
          user: userData || { name: 'Utilisateur', profile_picture_url: null }
        }
      })
    )

    const messages = allMessages
      .sort((a: any, b: any) => {
        const timeA = a.time?.seconds || a.time?._seconds || 0
        const timeB = b.time?.seconds || b.time?._seconds || 0
        return timeB - timeA
      })
      .slice(offset, offset + limit)

    return NextResponse.json({ success: true, messages })

  } catch (error: any) {
    console.error('❌ Erreur GET /api/messages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id_event, id_user, content } = body

    if (!id_event || !id_user || !content) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: id_event, id_user, content' },
        { status: 400 }
      )
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    const eventDoc = await adminDB.collection('events').doc(id_event).get()
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
    }

    const userDoc = await adminDB.collection('users').doc(id_user).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const eventData = eventDoc.data()
    const from_organizer = eventData?.created_by === id_user

    const messageData = {
      id_event,
      id_user,
      time: new Date(),
      content: content.trim(),
      from_organizer
    }

    const docRef = await adminDB.collection('messages').add(messageData)

    await adminDB.collection('users').doc(id_user).update({
      number_message_sent: FieldValue.increment(1),
      updated_at: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Message envoyé',
      messageId: docRef.id
    })

  } catch (error: any) {
    console.error('❌ Erreur POST /api/messages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, content, id_user } = body

    if (!id || !content || !id_user) {
      return NextResponse.json({ error: 'ID message, contenu et ID utilisateur requis' }, { status: 400 })
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    // Vérifier que le message existe
    const messageDoc = await adminDB.collection('messages').doc(id).get()
    if (!messageDoc.exists) {
      return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 })
    }

    const messageData = messageDoc.data()

    if (messageData?.id_user !== id_user) {
      return NextResponse.json({ error: 'Non autorisé à modifier ce message' }, { status: 403 })
    }

    await adminDB.collection('messages').doc(id).update({
      content: content.trim(),
      updated_at: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Message modifié' 
    })

  } catch (error: any) {
    console.error('❌ Erreur PUT /api/messages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: 'ID message et ID utilisateur requis' }, { status: 400 })
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    // Vérifier que le message existe
    const messageDoc = await adminDB.collection('messages').doc(id).get()
    if (!messageDoc.exists) {
      return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 })
    }

    const messageData = messageDoc.data()

    let canDelete = false

    if (messageData?.id_user === userId) {
      canDelete = true
    } else {
      const eventDoc = await adminDB.collection('events').doc(messageData?.id_event).get()
      if (eventDoc.exists && eventDoc.data()?.created_by === userId) {
        canDelete = true
      }
    }

    if (!canDelete) {
      return NextResponse.json({ error: 'Non autorisé à supprimer ce message' }, { status: 403 })
    }

    await adminDB.collection('messages').doc(id).delete()

    if (messageData?.id_user) {
      await adminDB.collection('users').doc(messageData.id_user).update({
        number_message_sent: FieldValue.increment(-1),
        updated_at: new Date()
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Message supprimé' 
    })

  } catch (error: any) {
    console.error('❌ Erreur DELETE /api/messages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}