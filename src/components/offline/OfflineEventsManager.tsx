'use client'

import { useState, useEffect } from 'react'
import { OfflineEventsService } from '@/lib/services/offline-events.service'
import { usePWA } from '@/components/pwa/PWAInstaller'
import styles from './OfflineEventsManager.module.css'

interface OfflineEventsManagerProps {
  userId: string
  createdEvents: any[]
  joinedEvents: any[]
  onDownloadComplete?: () => void
}

export function OfflineEventsManager({
  userId,
  createdEvents,
  joinedEvents,
  onDownloadComplete
}: OfflineEventsManagerProps) {
  const { isOnline } = usePWA()
  const [isDownloading, setIsDownloading] = useState(false)
  const [cacheInfo, setCacheInfo] = useState({
    hasCache: false,
    eventCount: 0,
    lastSync: null as Date | null,
    cacheAge: 0
  })

  // Mettre à jour les informations de cache
  useEffect(() => {
    const info = OfflineEventsService.getOfflineCacheInfo(userId)
    setCacheInfo(info)
  }, [userId])

  const handleDownloadEvents = async () => {
    if (!isOnline) {
      alert('Vous devez être connecté à internet pour télécharger vos événements')
      return
    }

    try {
      setIsDownloading(true)
      
      await OfflineEventsService.saveUserEventsForOffline(
        userId,
        createdEvents,
        joinedEvents
      )
      
      // Mettre à jour les informations de cache
      const newInfo = OfflineEventsService.getOfflineCacheInfo(userId)
      setCacheInfo(newInfo)
      
      onDownloadComplete?.()
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      alert('Erreur lors du téléchargement des événements')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleClearCache = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer vos événements hors ligne ?')) {
      OfflineEventsService.clearOfflineEvents()
      setCacheInfo({
        hasCache: false,
        eventCount: 0,
        lastSync: null,
        cacheAge: 0
      })
    }
  }

  const formatCacheAge = (ageMs: number): string => {
    const hours = Math.floor(ageMs / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `il y a ${days} jour${days > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `il y a ${hours}h`
    } else {
      return 'à l\'instant'
    }
  }

  return (
    <div className={styles.offlineManager}>
      <div className={styles.header}>
        <div className={styles.statusIndicator}>
          <span className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline}`} />
          <span className={styles.statusText}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
        
        <div className={styles.title}>
          <span className={styles.icon}>📱</span>
          <span>Accès hors ligne</span>
        </div>
      </div>

      <div className={styles.content}>
        {cacheInfo.hasCache ? (
          <div className={styles.cacheInfo}>
            <div className={styles.cacheStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{cacheInfo.eventCount}</span>
                <span className={styles.statLabel}>événements sauvegardés</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {cacheInfo.lastSync ? formatCacheAge(cacheInfo.cacheAge) : 'Jamais'}
                </span>
                <span className={styles.statLabel}>dernière synchronisation</span>
              </div>
            </div>
            
            <div className={styles.actions}>
              <button
                onClick={handleDownloadEvents}
                disabled={isDownloading || !isOnline}
                className={styles.downloadButton}
              >
                {isDownloading ? (
                  <>
                    <span className={styles.spinner} />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <span className={styles.icon}>🔄</span>
                    Mettre à jour
                  </>
                )}
              </button>
              
              <button
                onClick={handleClearCache}
                className={styles.clearButton}
              >
                <span className={styles.icon}>🗑️</span>
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.noCache}>
            <div className={styles.noCacheIcon}>📥</div>
            <h3 className={styles.noCacheTitle}>Accès hors ligne non configuré</h3>
            <p className={styles.noCacheDescription}>
              Téléchargez vos événements pour y accéder même sans connexion internet
            </p>
            
            <button
              onClick={handleDownloadEvents}
              disabled={isDownloading || !isOnline}
              className={styles.downloadButton}
            >
              {isDownloading ? (
                <>
                  <span className={styles.spinner} />
                  Téléchargement...
                </>
              ) : (
                <>
                  <span className={styles.icon}>📱</span>
                  Télécharger mes événements
                </>
              )}
            </button>
            
            {!isOnline && (
              <p className={styles.offlineWarning}>
                ⚠️ Connexion internet requise pour le téléchargement
              </p>
            )}
          </div>
        )}
      </div>
      
      {!isOnline && cacheInfo.hasCache && (
        <div className={styles.offlineNotice}>
          <span className={styles.icon}>ℹ️</span>
          <span>Vous consultez vos événements en mode hors ligne</span>
        </div>
      )}
    </div>
  )
}
