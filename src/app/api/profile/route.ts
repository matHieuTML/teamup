import { NextRequest, NextResponse } from 'next/server'
import { adminDB, adminAuth } from '@/lib/firebase-admin'
import { userProfileService } from '@/lib/services/user-profile.service'
import { z } from 'zod'

// Helper pour vérifier l'authentification
async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token d\'authentification requis')
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin non initialisé')
    }
    const decodedToken = await adminAuth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error('Erreur de vérification du token:', error)
    throw new Error('Token invalide')
  }
}

// Schéma de validation pour la mise à jour du profil
const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  location: z.string().min(2).max(100).optional().or(z.literal('')),
  birth_date: z.string().optional().refine((date) => {
    if (!date) return true
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime()) && parsedDate <= new Date()
  }, 'Date de naissance invalide'),
  notifications_enabled: z.boolean().optional(),
  sports_preferences: z.array(z.object({
    sport: z.enum(['foot', 'course', 'tennis', 'basket', 'natation']),
    level: z.enum(['debutant', 'intermediaire', 'confirme', 'expert'])
  })).optional(),
  profile_picture_url: z.string().url().optional().or(z.literal(''))
})

// GET /api/profile - Récupérer le profil de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const decodedToken = await requireAuth(request)
    const userId = decodedToken.uid

    try {
      if (!adminDB) {
        throw new Error('Firebase Admin DB non initialisé')
      }
      const userDoc = await adminDB.collection('users').doc(userId).get()
      
      if (!userDoc.exists) {
        return NextResponse.json(
          { error: 'Profil utilisateur non trouvé' },
          { status: 404 }
        )
      }

      const userData = userDoc.data()
      
      // Convertir les timestamps Firestore en dates
      const userProfile = {
        ...userData,
        birth_date: userData?.birth_date?.toDate(),
        created_at: userData?.created_at?.toDate(),
        updated_at: userData?.updated_at?.toDate(),
        deleted_at: userData?.deleted_at?.toDate()
      }

      return NextResponse.json({
        success: true,
        data: userProfile
      })

    } catch (serviceError) {
      console.error('Erreur récupération profil:', serviceError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du profil' },
        { status: 500 }
      )
    }

  } catch (authError) {
    console.error('Erreur authentification:', authError)
    return NextResponse.json(
      { error: authError instanceof Error ? authError.message : 'Erreur d\'authentification' },
      { status: 401 }
    )
  }
}

// PATCH /api/profile - Mettre à jour le profil de l'utilisateur connecté
export async function PATCH(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const decodedToken = await requireAuth(request)
    const userId = decodedToken.uid

    // Parsing et validation des données
    const body = await request.json()
    const validationResult = updateProfileSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Données invalides',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Préparer les données avec conversion de types
    const serviceUpdateData = {
      ...updateData,
      birth_date: updateData.birth_date ? new Date(updateData.birth_date) : undefined
    }

    try {
      if (!adminDB) {
        throw new Error('Firebase Admin DB non initialisé')
      }

      // Mise à jour directe dans Firestore avec Firebase Admin
      const userRef = adminDB.collection('users').doc(userId)
      const updateFields: Record<string, any> = {}

      // Ajouter seulement les champs définis
      if (serviceUpdateData.name !== undefined) updateFields.name = serviceUpdateData.name
      if (serviceUpdateData.location !== undefined) updateFields.location = serviceUpdateData.location
      if (serviceUpdateData.birth_date !== undefined) updateFields.birth_date = serviceUpdateData.birth_date
      if (serviceUpdateData.notifications_enabled !== undefined) updateFields.notifications_enabled = serviceUpdateData.notifications_enabled
      if (serviceUpdateData.sports_preferences !== undefined) updateFields.sports_preferences = serviceUpdateData.sports_preferences
      if (serviceUpdateData.profile_picture_url !== undefined) updateFields.profile_picture_url = serviceUpdateData.profile_picture_url
      
      updateFields.updated_at = new Date()

      await userRef.update(updateFields)
      
      // Récupération du profil mis à jour
      const updatedProfile = await userProfileService.getUserProfile(userId)

      return NextResponse.json({
        success: true,
        data: updatedProfile,
        message: 'Profil mis à jour avec succès'
      })

    } catch (serviceError) {
      console.error('Erreur service mise à jour profil:', serviceError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du profil' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erreur API profile PATCH:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/profile - Créer un nouveau profil utilisateur
export async function POST(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const decodedToken = await requireAuth(request)
    const userId = decodedToken.uid
    const userEmail = decodedToken.email

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email utilisateur requis' },
        { status: 400 }
      )
    }

    // Vérification que le profil n'existe pas déjà
    const existingProfile = await userProfileService.getUserProfile(userId)
    if (existingProfile) {
      return NextResponse.json(
        { error: 'Le profil existe déjà' },
        { status: 409 }
      )
    }

    // Parsing des données
    const body = await request.json()
    const { name, location, sports_preferences } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      )
    }

    try {
      const newProfile = await userProfileService.createUserProfile({
        id: userId,
        email: userEmail,
        name,
        location,
        sports_preferences: sports_preferences || []
      })

      return NextResponse.json({
        success: true,
        data: newProfile,
        message: 'Profil créé avec succès'
      }, { status: 201 })

    } catch (serviceError) {
      console.error('Erreur service création profil:', serviceError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erreur API profile POST:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}