'use client'

import { useState, useEffect } from 'react'
import { OfflineEventsService } from '@/lib/services/offline-events.service'
import { usePWA } from '@/components/pwa/PWAInstaller'
import styles from './OfflineButton.module.css'

interface Event {
  id: string
  name: string
  [key: string]: any
}

interface OfflineButtonProps {
  userId: string
  createdEvents: Event[]
  joinedEvents: Event[]
  onDownloadComplete?: () => void
}

export function OfflineButton({
  userId,
  createdEvents,
  joinedEvents,
  onDownloadComplete
}: OfflineButtonProps) {
  const { isOnline } = usePWA()
  const [isDownloading, setIsDownloading] = useState(false)
  const [cachedCount, setCachedCount] = useState(0)

  // Vérifier si des données hors ligne sont disponibles
  useEffect(() => {
    const offlineData = OfflineEventsService.getOfflineEvents(userId)
    if (offlineData) {
      setCachedCount(offlineData.events.length)
    } else {
      setCachedCount(0)
    }
  }, [userId])

  const handleDownload = async () => {
    if (!isOnline) {
      alert('Connexion internet requise pour télécharger')
      return
    }

    try {
      setIsDownloading(true)
      
      await OfflineEventsService.saveUserEventsForOffline(
        userId,
        createdEvents,
        joinedEvents
      )
      
      // Mettre à jour le compteur après téléchargement
      const totalEvents = createdEvents.length + joinedEvents.length
      setCachedCount(totalEvents)
      onDownloadComplete?.()
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      alert('Erreur lors du téléchargement')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className={styles.offlineButton}>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={styles.downloadButton}
        title="Télécharger mes événements pour un accès hors ligne"
      >
        {isDownloading ? (
          <>
            <div className={styles.spinner} />
            <span className={styles.buttonText}>Téléchargement...</span>
          </>
        ) : (
          <>
            <img 
              src="/svg/download-plus.svg" 
              alt="Télécharger" 
              className={styles.downloadIcon}
            />
            <span className={styles.buttonText}>Télécharger</span>
          </>
        )}
      </button>
      
      {cachedCount > 0 && (
        <div className={styles.cacheInfo}>
          <span className={styles.cacheCount}>{cachedCount} sauvegardé{cachedCount > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

// Hook pour vérifier si un événement est sauvegardé hors ligne
export function useOfflineEventStatus(userId: string, eventId: string) {
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const offlineData = OfflineEventsService.getOfflineEvents(userId)
    if (offlineData) {
      const eventExists = offlineData.events.some(event => event.id === eventId)
      setIsSaved(eventExists)
    }
  }, [userId, eventId])

  return isSaved
}
