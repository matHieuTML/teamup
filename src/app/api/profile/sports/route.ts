import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { userProfileService } from '@/lib/services/user-profile.service'
import { SportPreference, SportType, SportLevel } from '@/types/database'
import { z } from 'zod'

// Initialisation Firebase Admin SDK si pas encore fait
if (getApps().length === 0) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    })
  } catch (error) {
    console.error('Erreur initialisation Firebase Admin:', error)
  }
}

// Schémas de validation
const SportSchema = z.nativeEnum(SportType)
const LevelSchema = z.nativeEnum(SportLevel)
const SportPreferenceSchema = z.object({
  sport: SportSchema,
  level: LevelSchema
})

// Schéma de validation pour les préférences sportives
const sportsPreferencesSchema = z.object({
  sports_preferences: z.array(SportPreferenceSchema).max(5, 'Maximum 5 sports autorisés')
})

// PATCH /api/profile/sports - Mettre à jour les préférences sportives
export async function PATCH(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    let decodedToken
    try {
      decodedToken = await getAuth().verifyIdToken(token)
    } catch (error) {
      console.error('Erreur de vérification du token:', error)
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Validation des données
    const body = await request.json()
    const validationResult = sportsPreferencesSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Données invalides',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const { sports_preferences } = validationResult.data

    // Validation supplémentaire : pas de sports en double
    const sportTypes = sports_preferences.map(pref => pref.sport)
    const uniqueSportTypes = [...new Set(sportTypes)]
    
    if (sportTypes.length !== uniqueSportTypes.length) {
      return NextResponse.json(
        { error: 'Chaque sport ne peut être sélectionné qu\'une seule fois' },
        { status: 400 }
      )
    }

    try {
      // Vérification que le profil utilisateur existe
      const userProfile = await userProfileService.getUserProfile(userId)
      if (!userProfile) {
        return NextResponse.json(
          { error: 'Profil utilisateur non trouvé' },
          { status: 404 }
        )
      }

      // Mettre à jour les préférences sportives
      await userProfileService.updateSportsPreferences(userId, validationResult.data.sports_preferences)

      return NextResponse.json({
        success: true,
        data: {
          sports_preferences: validationResult.data.sports_preferences,
          updated_at: new Date().toISOString()
        },
        message: 'Préférences sportives mises à jour avec succès'
      })

    } catch (serviceError) {
      console.error('Erreur service mise à jour sports:', serviceError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour des préférences sportives' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erreur API profile sports PATCH:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// GET /api/profile/sports - Récupérer les préférences sportives disponibles
export async function GET(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    try {
      await getAuth().verifyIdToken(token)
    } catch (error) {
      console.error('Erreur de vérification du token:', error)
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    // Retourner les informations sur les sports disponibles
    const availableSports = ['foot', 'course', 'tennis', 'basket', 'natation'].map((sport: string) => ({
      id: sport,
      name: sport
    }))
    const availableLevels = ['debutant', 'intermediaire', 'confirme', 'expert'].map((level: string) => ({
      id: level,
      name: level
    }))

    return NextResponse.json({
      success: true,
      data: {
        availableSports,
        availableLevels,
        maxSportsAllowed: 5
      }
    })

  } catch (error) {
    console.error('Erreur API profile sports GET:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/profile/sports/add - Ajouter un sport aux préférences
export async function POST(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    let decodedToken
    try {
      decodedToken = await getAuth().verifyIdToken(token)
    } catch (error) {
      console.error('Erreur de vérification du token:', error)
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Validation du sport à ajouter
    const body = await request.json()
    const sportSchema = z.object({
      sport: z.nativeEnum(SportType),
      level: z.nativeEnum(SportLevel)
    })
    const sportToAdd = sportSchema.safeParse(body)

    if (!sportToAdd.success) {
      return NextResponse.json(
        { 
          error: 'Sport invalide',
          details: sportToAdd.error.format()
        },
        { status: 400 }
      )
    }

    try {
      // Récupération du profil actuel
      const userProfile = await userProfileService.getUserProfile(userId)
      if (!userProfile) {
        return NextResponse.json(
          { error: 'Profil utilisateur non trouvé' },
          { status: 404 }
        )
      }

      // Vérification que l'utilisateur n'a pas déjà ce sport
      const existingSport = userProfile.sports_preferences.find(
        pref => pref.sport === sportToAdd.data.sport
      )

      if (existingSport) {
        return NextResponse.json(
          { error: 'Ce sport est déjà dans vos préférences' },
          { status: 409 }
        )
      }

      // Vérification de la limite (5 sports max)
      if (userProfile.sports_preferences.length >= 5) {
        return NextResponse.json(
          { error: 'Vous avez atteint la limite de 5 sports' },
          { status: 400 }
        )
      }

      // Ajout du nouveau sport
      const updatedSports = [...userProfile.sports_preferences, sportToAdd.data]
      await userProfileService.updateSportsPreferences(userId, updatedSports as SportPreference[])

      return NextResponse.json({
        success: true,
        data: {
          sports_preferences: updatedSports,
          added_sport: sportToAdd.data
        },
        message: `Sport ajouté à vos préférences`
      })

    } catch (serviceError) {
      console.error('Erreur service ajout sport:', serviceError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout du sport' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erreur API profile sports POST:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}