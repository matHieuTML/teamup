'use client'

import { useOfflineEventStatus } from './OfflineButton'
import styles from './OfflineButton.module.css'

interface EventOfflineIndicatorProps {
  userId: string
  eventId: string
}

export function EventOfflineIndicator({ userId, eventId }: EventOfflineIndicatorProps) {
  const isSaved = useOfflineEventStatus(userId, eventId)

  if (!isSaved) return null

  return (
    <div className={styles.eventOfflineIndicator} title="Disponible hors ligne">
      <img 
        src="/svg/offline-saved.svg" 
        alt="Sauvegardé hors ligne" 
        className={styles.eventOfflineIcon}
      />
    </div>
  )
}
