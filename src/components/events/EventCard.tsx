'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Event } from '@/types/database'
import { EventService } from '@/lib/services/event.service'
import { useAuth } from '@/contexts/AuthContext'
import styles from './EventCard.module.css'

interface EventCardProps {
  event: Event & {
    participants_count?: number
    participants?: Array<{
      id: string
      name: string
      role: string
      profile_picture_url?: string | null
    }>
  }
}

export function EventCard({ event }: EventCardProps) {
  const { user } = useAuth()
  const eventDate = EventService.convertFirestoreDate(event.date)
  const isPast = eventDate < new Date()
  const participantsCount = event.participants_count || 0
  const participants = event.participants || []
  const isAuthenticated = !!user

  const getInitials = (name: string): string => {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
    return initials
  }

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
        
        <div className={`${styles.location} ${!isAuthenticated ? styles.blurred : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {isAuthenticated ? event.location_name : 'Connectez-vous pour voir'}
        </div>

        <div className={`${styles.dateTime} ${!isAuthenticated ? styles.blurred : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {isAuthenticated ? `${EventService.formatEventDate(event.date)} à ${EventService.formatEventTime(event.date)}` : 'Connectez-vous pour voir'}
        </div>

        <div className={styles.participantsRow}>
          <div className={styles.participantsInfo}>
            <div className={styles.avatars}>
              {participants.length > 0 ? (
                <>
                  {participants.slice(0, 3).map((participant, i) => {
                    return (
                      <div key={participant.id} className={`${styles.avatar} ${styles[`avatar${i + 1}`]}`}>
                        {participant.profile_picture_url ? (
                          <Image
                            src={participant.profile_picture_url}
                            alt={participant.name}
                            width={24}
                            height={24}
                            className={styles.avatarImage}
                          />
                        ) : (
                          getInitials(participant.name)
                        )}
                      </div>
                    )
                  })}
                  {participantsCount > 3 && (
                    <div className={`${styles.avatar} ${styles.avatarExtra}`}>
                      +{participantsCount - 3}
                    </div>
                  )}
                </>
              ) : (
                // Fallback si pas de participants
                <div className={`${styles.avatar} ${styles.avatar1}`}>
                  ?
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
