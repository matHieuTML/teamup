'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { fcmService } from '@/lib/services/fcm.service'
import styles from './NotificationTestButton.module.css'
import { User } from '@/types/database'
import { auth } from '@/lib/firebase'

interface NotificationTestButtonProps {
  user: User
}

export function NotificationTestButton({ user }: NotificationTestButtonProps) {
  const { user: authUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSetupLoading, setIsSetupLoading] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')

  const checkFCMSetup = useCallback(async () => {
    try {
      if (!user?.notifications_enabled) {
        setMessage('Les notifications sont désactivées dans votre profil.')
        setMessageType('error')
        return
      }

      if (!authUser?.uid) {
        setMessage('Authentification requise.')
        setMessageType('error')
        return
      }

      console.log('🔔 FCM: Auto-configuring notifications...')
      setMessage('Configuration automatique des notifications...')
      setMessageType('info')

      // Configuration automatique des notifications
      const success = await fcmService.setupForUser(authUser.uid)
      
      if (success) {
        setHasToken(true)
        setMessage('Notifications configurées et prêtes ! 🎉')
        setMessageType('success')
        console.log('🔔 FCM: Auto-configuration successful')
      } else {
        setMessage('Échec de la configuration automatique. Cliquez sur "Configurer" pour réessayer.')
        setMessageType('error')
        console.error('🔔 FCM: Auto-configuration failed')
      }
    } catch (error) {
      console.error('🔔 FCM: Error during auto-configuration:', error)
      setMessage('Erreur lors de la configuration. Cliquez sur "Configurer" pour réessayer.')
      setMessageType('error')
    }
  }, [user?.notifications_enabled, authUser?.uid])

  useEffect(() => {
    checkFCMSetup()
  }, [checkFCMSetup])

  const setupNotifications = async () => {
    console.log('🔔 SETUP: Starting notification setup...')
    console.log('🔔 SETUP: Auth User UID:', authUser?.uid)
    
    if (!authUser?.uid) {
      console.error('🔔 SETUP: No auth user UID')
      return
    }

    setIsSetupLoading(true)
    setMessage('Configuration des notifications...')
    setMessageType('info')

    try {
      console.log('🔔 SETUP: Calling fcmService.setupForUser...')
      const success = await fcmService.setupForUser(authUser.uid)
      console.log('🔔 SETUP: Setup result:', success)
      
      if (success) {
        setHasToken(true)
        setMessage('Notifications configurées avec succès ! ✅')
        setMessageType('success')
        console.log('🔔 SETUP: Setup completed successfully')
      } else {
        setMessage('Échec de la configuration. Vérifiez les autorisations du navigateur.')
        setMessageType('error')
        console.error('🔔 SETUP: Setup failed')
      }
    } catch (error) {
      console.error('🔔 SETUP: Error setting up notifications:', error)
      setMessage('Erreur lors de la configuration des notifications.')
      setMessageType('error')
    } finally {
      setIsSetupLoading(false)
    }
  }

  const sendTestNotification = async () => {
    console.log('🔔 TEST: Starting test notification process...')
    console.log('🔔 TEST: User ID from user object:', user?.id)
    console.log('🔔 TEST: Auth User UID:', authUser?.uid)
    console.log('🔔 TEST: Auth User:', authUser ? 'Present' : 'Missing')
    
    if (!authUser?.uid) {
      console.error('🔔 TEST: Missing auth user or UID')
      return
    }

    setIsLoading(true)
    setMessage('Envoi de la notification de test...')
    setMessageType('info')

    try {
      console.log('🔔 TEST: Getting auth token...')
      const currentUser = auth.currentUser
      if (!currentUser) {
        console.error('🔔 TEST: No current user found')
        setMessage('Erreur d&apos;authentification.')
        setMessageType('error')
        return
      }
      
      const token = await currentUser.getIdToken()
      if (!token) {
        console.error('🔔 TEST: Failed to get auth token')
        setMessage('Erreur d&apos;authentification.')
        setMessageType('error')
        return
      }
      console.log('🔔 TEST: Auth token obtained ✅')

      console.log('🔔 TEST: Sending request to /api/notifications/test...')
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: authUser.uid })
      })

      console.log('🔔 TEST: Response status:', response.status)
      console.log('🔔 TEST: Response ok:', response.ok)

      const data = await response.json()
      console.log('🔔 TEST: Response data:', data)

      if (response.ok && data.success) {
        console.log('🔔 TEST: Test notification sent successfully ✅')
        setMessage('🎉 Notification de test envoyée avec succès !')
        setMessageType('success')
      } else {
        console.error('🔔 TEST: Test notification failed:', data.error)
        setMessage(`Erreur: ${data.error || 'Échec de l&apos;envoi'}`)
        setMessageType('error')
      }
    } catch (error) {
      console.error('🔔 TEST: Error sending test notification:', error)
      setMessage('Erreur lors de l&apos;envoi de la notification.')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user?.notifications_enabled) {
    return (
      <div className={styles.notificationTest}>
        <div className={styles.header}>
          <h3 className={styles.title}>🔔 Notifications Push</h3>
          <p className={styles.description}>
            Activez les notifications dans vos paramètres de profil pour recevoir des alertes sur les événements.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.notificationTest}>
      <div className={styles.header}>
        <h3 className={styles.title}>🔔 Test des Notifications Push</h3>
        <p className={styles.description}>
          Testez les notifications push pour vous assurer qu'elles fonctionnent correctement.
        </p>
      </div>

      <div className={styles.status}>
        <div className={`${styles.message} ${styles[messageType]}`}>
          {message}
        </div>
      </div>

      <div className={styles.actions}>
        {!hasToken ? (
          <button
            onClick={setupNotifications}
            disabled={isSetupLoading}
            className={`${styles.button} ${styles.setupButton}`}
          >
            {isSetupLoading ? (
              <>
                <div className={styles.spinner} />
                Configuration...
              </>
            ) : (
              <>
                🔧 Configurer les notifications
              </>
            )}
          </button>
        ) : (
          <button
            onClick={sendTestNotification}
            disabled={isLoading}
            className={`${styles.button} ${styles.testButton}`}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                Envoi en cours...
              </>
            ) : (
              <>
                🚀 Envoyer une notification de test
              </>
            )}
          </button>
        )}
      </div>

      <div className={styles.info}>
        <p className={styles.infoText}>
          💡 <strong>Astuce :</strong> Si vous ne recevez pas la notification, vérifiez que :
        </p>
        <ul className={styles.infoList}>
          <li>Les notifications sont autorisées dans votre navigateur</li>
          <li>TeamUp n'est pas en mode "Ne pas déranger"</li>
          <li>Votre connexion internet est stable</li>
        </ul>
      </div>
    </div>
  )
}
