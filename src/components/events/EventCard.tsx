'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Event } from '@/types/database'
import { EventService } from '@/lib/services/event.service'
import styles from './EventCard.module.css'

interface EventCardProps {
  event: Event & {
    participants_count?: number
  }
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = EventService.convertFirestoreDate(event.date)
  const isPast = eventDate < new Date()
  const participantsCount = event.participants_count || 0

  const getStatusBadge = () => {
    if (isPast) {
      return { text: 'TERMINÉ', className: styles.statusPast }
    }
    if (event.max_participants && participantsCount >= event.max_participants) {
      return { text: 'COMPLET', className: styles.statusFull }
    }
    return { text: 'PLACES LIBRES', className: styles.statusAvailable }
  }

  const status = getStatusBadge()

  return (
    <Link href={`/events/${event.id}`} className={styles.eventCardLink}>
      <div className={styles.eventCard}>
        <div className={styles.cardHeader}>
          <div className={styles.popularTag}>
            {EventService.getEventTypeDisplay(event.type)}
          </div>
        </div>
        
        <div className={styles.imageContainer}>
          {event.picture_url ? (
            <Image 
              src={event.picture_url} 
              alt={event.name}
              width={280}
              height={140}
              className={styles.eventImage}
            />
          ) : (
            <div className={styles.placeholderImage}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10,8 16,12 10,16 10,8"/>
              </svg>
            </div>
          )}
        </div>

        <h3 className={styles.eventTitle}>
          {event.name.toUpperCase()}
        </h3>
        
        <div className={styles.location}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {event.location_name}
        </div>

        <div className={styles.participantsRow}>
          <div className={styles.participantsInfo}>
            <div className={styles.avatars}>
              {[...Array(Math.min(3, participantsCount))].map((_, i) => (
                <div key={i} className={`${styles.avatar} ${styles[`avatar${i + 1}`]}`}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {participantsCount > 3 && (
                <div className={`${styles.avatar} ${styles.avatarExtra}`}>
                  +{participantsCount - 3}
                </div>
              )}
            </div>
            <span className={styles.participantsCount}>
              {participantsCount}
              {event.max_participants && `/${event.max_participants}`}
            </span>
          </div>

          <div className={`${styles.statusTag} ${status.className}`}>
            {status.text}
          </div>
        </div>
      </div>
    </Link>
  )
}
