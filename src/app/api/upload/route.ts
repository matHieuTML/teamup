import { NextRequest, NextResponse } from 'next/server'
import { initializeFirebaseAdmin, adminAuth } from '@/lib/firebase-admin'
import { imageUploadService } from '@/lib/services/image-upload.service'
import { z } from 'zod'

// Initialiser Firebase Admin avec le module centralisé
initializeFirebaseAdmin()

// Validation du type d'upload
const uploadTypeSchema = z.enum(['profile-picture', 'event-image', 'general'])

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
      if (!adminAuth) {
        throw new Error('Firebase Admin Auth non initialisé')
      }
      decodedToken = await adminAuth.verifyIdToken(token)
    } catch (error) {
      console.error('Erreur de vérification du token:', error)
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid

    // Parsing des données form-data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadType = formData.get('uploadType') as string || 'general'

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Validation du type d'upload
    const validatedUploadType = uploadTypeSchema.safeParse(uploadType)
    if (!validatedUploadType.success) {
      return NextResponse.json(
        { error: 'Type d\'upload invalide' },
        { status: 400 }
      )
    }

    let uploadResult

    try {
      // Upload spécialisé selon le type
      switch (validatedUploadType.data) {
        case 'profile-picture':
          uploadResult = await imageUploadService.uploadProfilePicture(file, userId)
          break
        
        case 'event-image':
          uploadResult = await imageUploadService.uploadImage(file, userId, {
            folder: 'event-images',
            maxSizeBytes: 8 * 1024 * 1024, // 8MB pour les événements
            quality: 0.85
          })
          break
        
        default:
          uploadResult = await imageUploadService.uploadImage(file, userId, {
            folder: 'general'
          })
      }

      return NextResponse.json({
        success: true,
        data: {
          url: uploadResult.url,
          fileName: uploadResult.fileName,
          size: uploadResult.size,
          uploadType: validatedUploadType.data
        }
      })

    } catch (uploadError) {
      console.error('Erreur d\'upload:', uploadError)
      
      const errorMessage = uploadError instanceof Error 
        ? uploadError.message 
        : 'Erreur lors de l\'upload'

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erreur API upload:', error)
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// GET pour récupérer les informations d'upload autorisées
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    try {
      if (!adminAuth) {
        throw new Error('Firebase Admin Auth non initialisé')
      }
      await adminAuth.verifyIdToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        uploadTypes: ['profile-picture', 'event-image', 'general'],
        limits: {
          'profile-picture': {
            maxSize: 2 * 1024 * 1024, // 2MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            description: 'Photo de profil (format carré, max 2MB)'
          },
          'event-image': {
            maxSize: 8 * 1024 * 1024, // 8MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            description: 'Image d\'événement (max 8MB)'
          },
          'general': {
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            description: 'Image générale (max 5MB)'
          }
        }
      }
    })

  } catch (error) {
    console.error('Erreur API upload GET:', error)
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}