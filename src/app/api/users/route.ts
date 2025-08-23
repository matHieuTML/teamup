import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebase-admin'
import { User } from '@/types/database'

// GET - Récupérer tous les utilisateurs ou un utilisateur spécifique
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    if (uid) {
      // Récupérer un utilisateur spécifique
      const userDoc = await adminDB.collection('users').doc(uid).get()
      
      if (!userDoc.exists) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
      }

      return NextResponse.json({ 
        success: true, 
        user: { id: userDoc.id, ...userDoc.data() } 
      })
    } else {
      // Récupérer tous les utilisateurs (avec pagination)
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = parseInt(searchParams.get('offset') || '0')
      
      const usersSnapshot = await adminDB
        .collection('users')
        .limit(limit)
        .offset(offset)
        .get()

      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      return NextResponse.json({ success: true, users })
    }
  } catch (error: any) {
    console.error('❌ Erreur GET /api/users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, email, name } = body

    if (!uid || !email || !name) {
      return NextResponse.json(
        { error: 'UID, email et nom requis' },
        { status: 400 }
      )
    }

    // Tentative de sauvegarde avec Firebase Admin
    if (adminDB) {
      const userData = {
        email,
        name,
        sports_preferences: [],
        number_event_created: 0,
        number_event_joined: 0,
        number_message_sent: 0,
        notifications_enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      }

      await adminDB.collection('users').doc(uid).set(userData)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Utilisateur créé dans Firestore via Admin SDK' 
      })
    } else {
      // Fallback : juste confirmer la réception
      console.log('📝 Utilisateur reçu (Admin SDK non disponible):', { uid, email, name })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Utilisateur reçu côté serveur (Firestore non configuré)' 
      })
    }

  } catch (error: any) {
    console.error('❌ Erreur POST /api/users:', error)
    
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, ...updateData } = body

    if (!uid) {
      return NextResponse.json({ error: 'UID requis' }, { status: 400 })
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    // Vérifier que l'utilisateur existe
    const userDoc = await adminDB.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Mettre à jour avec updated_at
    const updatedData = {
      ...updateData,
      updated_at: new Date()
    }

    await adminDB.collection('users').doc(uid).update(updatedData)

    return NextResponse.json({ 
      success: true, 
      message: 'Utilisateur mis à jour' 
    })

  } catch (error: any) {
    console.error('❌ Erreur PUT /api/users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Supprimer un utilisateur (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')

    if (!uid) {
      return NextResponse.json({ error: 'UID requis' }, { status: 400 })
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Firebase Admin non configuré' }, { status: 500 })
    }

    // Vérifier que l'utilisateur existe
    const userDoc = await adminDB.collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Soft delete - marquer comme supprimé
    await adminDB.collection('users').doc(uid).update({
      deleted_at: new Date(),
      updated_at: new Date()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Utilisateur supprimé' 
    })

  } catch (error: any) {
    console.error('❌ Erreur DELETE /api/users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}