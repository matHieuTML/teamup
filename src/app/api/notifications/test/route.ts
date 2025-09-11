import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDB } from '@/lib/firebase-admin'
import { z } from 'zod'
import { GoogleAuth } from 'google-auth-library'

const testNotificationSchema = z.object({
  userId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    if (!adminAuth) {
      return NextResponse.json({ error: 'Service non disponible' }, { status: 503 })
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    const body = await request.json()
    const { userId: requestUserId } = testNotificationSchema.parse(body)

    // Vérifier que l'utilisateur ne peut envoyer une notification test qu'à lui-même
    if (userId !== requestUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    if (!adminDB) {
      return NextResponse.json({ error: 'Base de données non disponible' }, { status: 503 })
    }

    // Récupérer les données utilisateur depuis Firestore
    const userDoc = await adminDB.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const userData = userDoc.data()
    
    console.log('🔔 API: ========== SERVER NOTIFICATION TEST START ==========')
    console.log('🔔 API: Step 1/8 - User data retrieved from Firestore:')
    console.log('🔔 API: User ID:', userId)
    console.log('🔔 API: User exists in Firestore:', userDoc.exists)
    console.log('🔔 API: Has FCM token:', !!userData?.fcm_token)
    console.log('🔔 API: FCM token preview:', userData?.fcm_token ? userData.fcm_token.substring(0, 30) + '...' : 'NULL')
    console.log('🔔 API: FCM token length:', userData?.fcm_token ? userData.fcm_token.length : 0)
    console.log('🔔 API: Token updated at:', userData?.fcm_token_updated_at)
    console.log('🔔 API: Notifications enabled:', userData?.notifications_enabled)
    console.log('🔔 API: Full user data keys:', Object.keys(userData || {}))
    
    if (!userData?.fcm_token) {
      return NextResponse.json({ 
        error: 'Token FCM non trouvé. Veuillez d\'abord autoriser les notifications.' 
      }, { status: 400 })
    }

    console.log('🔔 API: Step 2/8 - Checking notification preferences...')
    if (!userData?.notifications_enabled) {
      console.error('🔔 API: ❌ CRITICAL ERROR: Notifications disabled for user')
      console.error('🔔 API: notifications_enabled value:', userData?.notifications_enabled)
      return NextResponse.json({ 
        error: 'Les notifications sont désactivées pour cet utilisateur' 
      }, { status: 400 })
    }
    console.log('🔔 API: ✅ Notifications are enabled for user')

    console.log('🔔 API: Step 3/8 - Extracting FCM token...')
    const fcmToken = userData.fcm_token
    console.log('🔔 API: FCM token extracted:', fcmToken ? 'SUCCESS' : 'FAILED')
    console.log('🔔 API: FCM token type:', typeof fcmToken)
    console.log('🔔 API: FCM token preview:', fcmToken ? fcmToken.substring(0, 30) + '...' : 'NULL')

    console.log('🔔 API: Step 4/8 - Preparing FCM HTTP V1 API call...')
    const projectId = process.env.FIREBASE_PROJECT_ID || 'teamup-75a27'
    console.log('🔔 API: Project ID:', projectId)
    
    console.log('🔔 API: Step 5/8 - Getting access token for FCM V1...')
    
    // Configuration des credentials Firebase pour Google Auth
    const serviceAccountKey = {
      type: "service_account",
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
      private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
      auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
      token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_CERT_URL || `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_ADMIN_CLIENT_EMAIL}`
    }
    
    console.log('🔔 API: Service account config:', {
      project_id: serviceAccountKey.project_id,
      client_email: serviceAccountKey.client_email,
      has_private_key: !!serviceAccountKey.private_key
    })
    
    const auth = new GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    })
    
    const accessToken = await auth.getAccessToken()
    console.log('🔔 API: Access token obtained:', !!accessToken)
    console.log('🔔 API: Access token preview:', accessToken ? accessToken.substring(0, 20) + '...' : 'NULL')
    
    // Préparer le payload FCM V1
    const fcmV1Payload = {
      message: {
        token: fcmToken,
        notification: {
          title: '🏆 TeamUp - Test de notification',
          body: `Salut ${userData.name || 'Sportif'} ! Vos notifications fonctionnent parfaitement. 🎉`
        },
        data: {
          type: 'test_notification',
          userId: userId,
          timestamp: new Date().toISOString()
        },
        webpush: {
          headers: {
            TTL: '86400'
          },
          notification: {
            icon: '/images/logo/teamup-logo-192.png',
            badge: '/images/logo/teamup-logo-72.png',
            tag: 'teamup-test',
            requireInteraction: true,
            actions: [
              {
                action: 'open',
                title: 'Ouvrir TeamUp'
              }
            ]
          },
          fcm_options: {
            link: '/profile'
          }
        }
      }
    }
    
    console.log('🔔 API: Step 6/8 - FCM V1 payload prepared:')
    console.log('🔔 API: - Token:', fcmV1Payload.message.token ? fcmV1Payload.message.token.substring(0, 30) + '...' : 'NULL')
    console.log('🔔 API: - Title:', fcmV1Payload.message.notification?.title)
    console.log('🔔 API: - Body:', fcmV1Payload.message.notification?.body)
    console.log('🔔 API: - Data:', fcmV1Payload.message.data)
    
    console.log('🔔 API: Step 7/8 - Sending notification via FCM HTTP V1 API...')
    const sendStartTime = Date.now()
    
    let response = 'FCM_V1_SUCCESS'
    
    try {
      const fcmResponse = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fcmV1Payload)
      })
      
      const sendEndTime = Date.now()
      console.log('🔔 API: FCM V1 response status:', fcmResponse.status)
      console.log('🔔 API: FCM V1 response ok:', fcmResponse.ok)
      console.log('🔔 API: Send duration:', sendEndTime - sendStartTime, 'ms')
      
      if (fcmResponse.ok) {
        const responseData = await fcmResponse.json()
        console.log('🔔 API: Step 8/8 - ✅ NOTIFICATION SENT SUCCESSFULLY!')
        console.log('🔔 API: FCM V1 response:', responseData)
        console.log('🔔 API: Message name:', responseData.name)
        
        response = responseData.name // FCM V1 returns message name instead of ID
      } else {
        const errorData = await fcmResponse.json()
        console.error('🔔 API: ❌ FCM V1 HTTP ERROR:')
        console.error('🔔 API: Status:', fcmResponse.status)
        console.error('🔔 API: Status text:', fcmResponse.statusText)
        console.error('🔔 API: Error data:', errorData)
        
        // Analyser l'erreur FCM V1
        if (errorData.error?.details?.[0]?.errorCode === 'UNREGISTERED') {
          throw new Error('messaging/registration-token-not-registered')
        } else if (errorData.error?.details?.[0]?.errorCode === 'INVALID_ARGUMENT') {
          throw new Error('messaging/invalid-registration-token')
        } else {
          throw new Error(`FCM V1 Error: ${errorData.error?.message || 'Unknown error'}`)
        }
      }
    } catch (sendError) {
      console.error('🔔 API: ❌ FCM V1 SEND ERROR:')
      console.error('🔔 API: Error type:', (sendError as Error).constructor.name)
      console.error('🔔 API: Error message:', (sendError as Error).message)
      console.error('🔔 API: Full error:', sendError)
      throw sendError // Re-throw to be caught by outer try-catch
    }

    console.log('🔔 API: Step 8/8 - Preparing success response...')
    console.log('🔔 API: Response value:', response)
    
    return NextResponse.json({
      success: true,
      message: 'Notification de test envoyée avec succès via FCM V1 !',
      response: response,
      apiVersion: 'FCM_V1'
    })

  } catch (error) {
    console.error('Error sending test notification:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: (error as z.ZodError).issues 
      }, { status: 400 })
    }

    console.error('🔔 API: ========== SERVER NOTIFICATION ERROR ANALYSIS ==========')
    console.error('🔔 API: Error analysis:')
    console.error('🔔 API: - Error type:', (error as any)?.constructor?.name)
    console.error('🔔 API: - Error code:', (error as any)?.code)
    console.error('🔔 API: - Error message:', (error as any)?.message)
    console.error('🔔 API: - Error stack:', (error as any)?.stack)
    
    // Gestion des erreurs spécifiques FCM V1
    const errorMessage = (error as Error).message
    
    if (errorMessage.includes('messaging/registration-token-not-registered') || errorMessage.includes('UNREGISTERED')) {
      console.error('🔔 API: ❌ SPECIFIC ERROR: Token not registered (expired/invalid)')
      console.error('🔔 API: This means the FCM token is no longer valid on Firebase servers')
      console.error('🔔 API: Client needs to generate a new token')
      return NextResponse.json({ 
        error: 'Token FCM expiré. Veuillez recharger la page et réautoriser les notifications.',
        errorCode: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString(),
        apiVersion: 'FCM_V1'
      }, { status: 400 })
    }

    if (errorMessage.includes('messaging/invalid-registration-token') || errorMessage.includes('INVALID_ARGUMENT')) {
      console.error('🔔 API: ❌ SPECIFIC ERROR: Invalid registration token format')
      console.error('🔔 API: This means the FCM token format is malformed')
      return NextResponse.json({ 
        error: 'Token FCM invalide. Veuillez réautoriser les notifications.',
        errorCode: 'TOKEN_INVALID',
        timestamp: new Date().toISOString(),
        apiVersion: 'FCM_V1'
      }, { status: 400 })
    }

    if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
      console.error('🔔 API: ❌ SPECIFIC ERROR: Permission denied')
      console.error('🔔 API: This means Firebase project configuration or service account is wrong')
      return NextResponse.json({ 
        error: 'Configuration Firebase incorrecte.',
        errorCode: 'CONFIG_ERROR',
        timestamp: new Date().toISOString(),
        apiVersion: 'FCM_V1'
      }, { status: 500 })
    }

    console.error('🔔 API: ❌ UNKNOWN ERROR: Unhandled FCM V1 error')
    console.error('🔔 API: ========== SERVER NOTIFICATION UNKNOWN ERROR ==========')
    return NextResponse.json({ 
      error: 'Erreur lors de l\'envoi de la notification de test',
      errorCode: 'UNKNOWN_ERROR',
      errorDetails: (error as Error).message,
      timestamp: new Date().toISOString(),
      apiVersion: 'FCM_V1'
    }, { status: 500 })
  }
}
