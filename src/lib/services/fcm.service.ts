'use client'

import { messaging, auth } from '@/lib/firebase'
import { getToken, onMessage } from 'firebase/messaging'

export class FCMService {
  private static instance: FCMService
  private messagingInstance: any = null
  private vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

  private constructor() {}

  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService()
    }
    return FCMService.instance
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔔 FCM: Initializing service...')
      this.messagingInstance = await messaging()
      if (!this.messagingInstance) {
        console.warn('🔔 FCM: Messaging not supported in this browser')
        return
      }

      // Écouter les messages en premier plan
      onMessage(this.messagingInstance, (payload) => {
        console.log('🔔 FCM: Message received in foreground', payload)
        this.showNotification(payload)
      })

      console.log('🔔 FCM: Service initialized successfully')
    } catch (error) {
      console.error('🔔 FCM: Failed to initialize', error)
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      console.log('🔔 FCM: Requesting notification permission...')
      
      if (!('Notification' in window)) {
        console.warn('🔔 FCM: This browser does not support notifications')
        return false
      }

      console.log('🔔 FCM: Current permission status:', Notification.permission)

      if (Notification.permission === 'granted') {
        console.log('🔔 FCM: Permission already granted')
        return true
      }

      if (Notification.permission === 'denied') {
        console.warn('🔔 FCM: Notification permission denied')
        return false
      }

      console.log('🔔 FCM: Requesting permission from user...')
      const permission = await Notification.requestPermission()
      console.log('🔔 FCM: Permission result:', permission)
      
      return permission === 'granted'
    } catch (error) {
      console.error('🔔 FCM: Failed to request permission', error)
      return false
    }
  }

  async getToken(): Promise<string | null> {
    try {
      console.log('🔔 FCM: ========== TOKEN GENERATION START ==========')
      console.log('🔔 FCM: Step 1/6 - Checking VAPID Key...')
      console.log('🔔 FCM: VAPID Key:', this.vapidKey ? `Present ✅ (${this.vapidKey.substring(0, 20)}...)` : 'Missing ❌')
      
      if (!this.messagingInstance) {
        console.log('🔔 FCM: Step 2/6 - Messaging instance not found, initializing...')
        await this.initialize()
        if (!this.messagingInstance) {
          console.error('🔔 FCM: ❌ CRITICAL ERROR: Failed to initialize messaging instance')
          return null
        }
        console.log('🔔 FCM: ✅ Messaging instance initialized successfully')
      } else {
        console.log('🔔 FCM: Step 2/6 - Messaging instance already available ✅')
      }

      console.log('🔔 FCM: Step 3/6 - Checking notification permissions...')
      const hasPermission = await this.requestPermission()
      if (!hasPermission) {
        console.error('🔔 FCM: ❌ CRITICAL ERROR: No permission granted, cannot generate token')
        console.error('🔔 FCM: Current permission status:', Notification.permission)
        return null
      }
      console.log('🔔 FCM: ✅ Permission granted successfully')

      console.log('🔔 FCM: Step 4/6 - Requesting token from Firebase...')
      console.log('🔔 FCM: Using messaging instance:', !!this.messagingInstance)
      console.log('🔔 FCM: Using VAPID key:', !!this.vapidKey)
      
      const tokenStartTime = Date.now()
      const token = await getToken(this.messagingInstance, {
        vapidKey: this.vapidKey
      })
      const tokenEndTime = Date.now()
      
      console.log('🔔 FCM: Step 5/6 - Token request completed in', tokenEndTime - tokenStartTime, 'ms')

      if (token) {
        console.log('🔔 FCM: Step 6/6 - ✅ TOKEN GENERATED SUCCESSFULLY!')
        console.log('🔔 FCM: Token preview:', token.substring(0, 30) + '...')
        console.log('🔔 FCM: Token length:', token.length, 'characters')
        console.log('🔔 FCM: Token generated at:', new Date().toISOString())
        console.log('🔔 FCM: ========== TOKEN GENERATION SUCCESS ==========')
        return token
      } else {
        console.error('🔔 FCM: ❌ CRITICAL ERROR: No token received from Firebase')
        console.error('🔔 FCM: This usually means:')
        console.error('🔔 FCM: 1. VAPID key is invalid')
        console.error('🔔 FCM: 2. Firebase project configuration is wrong')
        console.error('🔔 FCM: 3. Network connectivity issues')
        console.log('🔔 FCM: ========== TOKEN GENERATION FAILED ==========')
        return null
      }
    } catch (error) {
      console.error('🔔 FCM: ❌ EXCEPTION during token generation:')
      console.error('🔔 FCM: Error type:', error.constructor.name)
      console.error('🔔 FCM: Error message:', error.message)
      console.error('🔔 FCM: Error code:', error.code)
      console.error('🔔 FCM: Full error:', error)
      console.log('🔔 FCM: ========== TOKEN GENERATION EXCEPTION ==========')
      return null
    }
  }

  async saveTokenToServer(userId: string, token: string): Promise<boolean> {
    try {
      console.log('🔔 FCM: ========== TOKEN SAVE TO SERVER START ==========')
      console.log('🔔 FCM: Step 1/5 - Preparing to save token for user:', userId)
      console.log('🔔 FCM: Token to save (preview):', token.substring(0, 30) + '...')
      console.log('🔔 FCM: Token length:', token.length, 'characters')
      
      console.log('🔔 FCM: Step 2/5 - Checking Firebase Auth current user...')
      const currentUser = auth.currentUser
      if (!currentUser) {
        console.error('🔔 FCM: ❌ CRITICAL ERROR: No current user for authentication')
        console.error('🔔 FCM: Auth state:', auth.currentUser)
        console.error('🔔 FCM: This means user is not logged in!')
        return false
      }
      console.log('🔔 FCM: ✅ Current user found:', currentUser.uid)
      console.log('🔔 FCM: User email:', currentUser.email)
      
      console.log('🔔 FCM: Step 3/5 - Getting Firebase Auth ID token...')
      const authTokenStartTime = Date.now()
      const authToken = await currentUser.getIdToken()
      const authTokenEndTime = Date.now()
      
      if (!authToken) {
        console.error('🔔 FCM: ❌ CRITICAL ERROR: Failed to get auth token')
        return false
      }
      console.log('🔔 FCM: ✅ Auth token obtained in', authTokenEndTime - authTokenStartTime, 'ms')
      console.log('🔔 FCM: Auth token preview:', authToken.substring(0, 20) + '...')
      
      console.log('🔔 FCM: Step 4/5 - Sending POST request to /api/notifications/token...')
      const requestPayload = { userId, token }
      console.log('🔔 FCM: Request payload:', requestPayload)
      console.log('🔔 FCM: Request headers: Content-Type, Authorization')
      
      const requestStartTime = Date.now()
      const response = await fetch('/api/notifications/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestPayload)
      })
      const requestEndTime = Date.now()

      console.log('🔔 FCM: Step 5/5 - Processing server response...')
      console.log('🔔 FCM: Response status:', response.status)
      console.log('🔔 FCM: Response ok:', response.ok)
      console.log('🔔 FCM: Request completed in', requestEndTime - requestStartTime, 'ms')
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('🔔 FCM: ✅ TOKEN SAVED SUCCESSFULLY!')
        console.log('🔔 FCM: Server response:', responseData)
        console.log('🔔 FCM: ========== TOKEN SAVE SUCCESS ==========')
        return true
      } else {
        const errorText = await response.text()
        console.error('🔔 FCM: ❌ SERVER ERROR during token save:')
        console.error('🔔 FCM: Status:', response.status)
        console.error('🔔 FCM: Status text:', response.statusText)
        console.error('🔔 FCM: Error response:', errorText)
        console.log('🔔 FCM: ========== TOKEN SAVE FAILED ==========')
        return false
      }
    } catch (error) {
      console.error('🔔 FCM: ❌ EXCEPTION during token save:')
      console.error('🔔 FCM: Error type:', error.constructor.name)
      console.error('🔔 FCM: Error message:', error.message)
      console.error('🔔 FCM: Full error:', error)
      console.log('🔔 FCM: ========== TOKEN SAVE EXCEPTION ==========')
      return false
    }
  }

  async setupForUser(userId: string): Promise<boolean> {
    try {
      console.log('🔔 FCM: Setting up FCM for user:', userId)
      
      await this.initialize()
      
      const hasPermission = await this.requestPermission()
      if (!hasPermission) {
        console.error('🔔 FCM: Setup failed - no permission')
        return false
      }

      const token = await this.getToken()
      if (!token) {
        console.error('🔔 FCM: Setup failed - no token')
        return false
      }

      const saved = await this.saveTokenToServer(userId, token)
      if (saved) {
        console.log('🔔 FCM: Setup completed successfully ✅')
      } else {
        console.error('🔔 FCM: Setup failed - token not saved')
      }
      
      return saved
    } catch (error) {
      console.error('🔔 FCM: Setup failed', error)
      return false
    }
  }

  async sendTestNotification(userId: string): Promise<boolean> {
    try {
      console.log('🔔 FCM: Sending test notification for user:', userId)
      
      // Obtenir le token d'authentification Firebase
      const currentUser = auth.currentUser
      if (!currentUser) {
        console.error('🔔 FCM: No current user for authentication')
        return false
      }
      
      const authToken = await currentUser.getIdToken()
      if (!authToken) {
        console.error('🔔 FCM: Failed to get auth token')
        return false
      }
      
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ userId })
      })

      console.log('🔔 FCM: Test notification response status:', response.status)
      
      if (response.ok) {
        console.log('🔔 FCM: Test notification sent successfully ✅')
        return true
      } else {
        const errorData = await response.json()
        console.error('🔔 FCM: Failed to send test notification:', errorData)
        
        // Si le token FCM est expiré, essayer de le renouveler automatiquement
        if (errorData.error?.includes('Token FCM expiré') || errorData.error?.includes('registration-token-not-registered')) {
          console.log('🔔 FCM: Token expired, attempting to refresh...')
          
          // Régénérer et sauvegarder un nouveau token
          const refreshSuccess = await this.setupForUser(userId)
          if (refreshSuccess) {
            console.log('🔔 FCM: Token refreshed, retrying notification...')
            
            // Réessayer l'envoi avec le nouveau token
            const retryResponse = await fetch('/api/notifications/test', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({ userId })
            })
            
            if (retryResponse.ok) {
              console.log('🔔 FCM: Test notification sent successfully after token refresh ✅')
              return true
            }
          }
        }
        
        return false
      }
    } catch (error) {
      console.error('🔔 FCM: Failed to send test notification', error)
      return false
    }
  }

  private showNotification(payload: any) {
    console.log('🔔 FCM: Showing notification:', payload)
    console.log('🔔 FCM: Notification permission:', Notification.permission)
    
    // Vérifier les permissions de notification
    if (!('Notification' in window)) {
      console.warn('🔔 FCM: Notifications not supported in this browser')
      return
    }

    if (Notification.permission === 'denied') {
      console.warn('🔔 FCM: Notifications are blocked by user')
      return
    }

    if (Notification.permission === 'default') {
      console.log('🔔 FCM: Requesting notification permission...')
      Notification.requestPermission().then(permission => {
        console.log('🔔 FCM: Permission result:', permission)
        if (permission === 'granted') {
          this.displayNotification(payload)
        }
      })
      return
    }

    if (Notification.permission === 'granted') {
      this.displayNotification(payload)
    }
  }

  private displayNotification(payload: any) {
    const notificationTitle = payload.notification?.title || 'TeamUp'
    
    // Utiliser une icône qui existe ou une icône par défaut du navigateur
    const notificationOptions = {
      body: payload.notification?.body || 'Nouvelle notification',
      // Pas d'icône pour éviter les erreurs 404 sur localhost
      tag: 'teamup-notification',
      requireInteraction: false, // Changé pour Chrome localhost
      silent: false,
      vibrate: [200, 100, 200],
      // Forcer l'affichage même sur localhost
      renotify: true,
      timestamp: Date.now()
    }

    console.log('🔔 FCM: Creating notification with options:', notificationOptions)
    console.log('🔔 FCM: User Agent:', navigator.userAgent)
    console.log('🔔 FCM: Is localhost:', window.location.hostname === 'localhost')
    
    try {
      const notification = new Notification(notificationTitle, notificationOptions)
      
      // Forcer l'affichage avec un timeout
      setTimeout(() => {
        console.log('🔔 FCM: Notification should be visible now')
        console.log('🔔 FCM: Check your system notifications (top-right on macOS)')
      }, 100)
      
      notification.onclick = () => {
        console.log('🔔 FCM: Notification clicked')
        window.focus()
        notification.close()
      }
      
      notification.onshow = () => {
        console.log('🔔 FCM: ✅ Notification displayed successfully!')
        console.log('🔔 FCM: Look for the notification popup on your screen!')
      }
      
      notification.onerror = (error) => {
        console.error('🔔 FCM: ❌ Notification error:', error)
      }
      
      notification.onclose = () => {
        console.log('🔔 FCM: Notification closed')
      }
      
    } catch (error) {
      console.error('🔔 FCM: ❌ Failed to create notification:', error)
      
      // Fallback : essayer avec options minimales
      console.log('🔔 FCM: Trying fallback notification...')
      try {
        const fallbackNotification = new Notification(notificationTitle, {
          body: payload.notification?.body || 'Nouvelle notification'
        })
        console.log('🔔 FCM: Fallback notification created')
      } catch (fallbackError) {
        console.error('🔔 FCM: ❌ Fallback notification also failed:', fallbackError)
      }
    }
  }
}

export const fcmService = FCMService.getInstance()
