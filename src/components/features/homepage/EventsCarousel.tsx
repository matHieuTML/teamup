'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '../../ui'
import { Event } from '@/types/database'
import { EventService } from '@/lib/services/event.service'
import { useAuth } from '@/contexts/AuthContext'
import '../../../styles/components/EventsCarousel.css'

const EventsCarousel = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isAuthenticated = !!user

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events')
        
        if (response.ok) {
          const data = await response.json()
          
          // Vérifier que data.data.events existe et est un tableau
          if (data && data.data && data.data.events && Array.isArray(data.data.events)) {
            // Filtrer les événements futurs uniquement
            const now = new Date()
            const futureEvents = data.data.events.filter((event: Event) => {
              const eventDate = EventService.convertFirestoreDate(event.date)
              return eventDate > now
            })
            
            
            setEvents(futureEvents.slice(0, 5))
          } else {
            setEvents([])
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des événements:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const formatDateTime = (date: Date | { seconds: number; nanoseconds: number }) => {
    const eventDate = EventService.convertFirestoreDate(date)
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }
    return eventDate.toLocaleDateString('fr-FR', options)
  }

  if (isLoading) {
    return (
      <div className="events-carousel">
        <div className="events-carousel__container">
          <div className="events-carousel__header">
            <div className="events-carousel__badge">
              <div className="events-carousel__badge-dot"></div>
              Populaire
            </div>
            <h2 className="events-carousel__title">
              ÉVÉNEMENTS POPULAIRES
            </h2>
            <p className="events-carousel__subtitle">
              Chargement des événements...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="events-carousel">
      <div className="events-carousel__container">
        <div className="events-carousel__header">
          <div className="events-carousel__badge">
            <div className="events-carousel__badge-dot"></div>
            Populaire
          </div>
          
          <h2 className="events-carousel__title">
            ÉVÉNEMENTS POPULAIRES
          </h2>
          <p className="events-carousel__subtitle">
            Découvrez les activités sportives les plus populaires près de chez vous
          </p>
        </div>

        <div className="events-carousel__list">
          {events.map((event) => {
            const participantCount = (event as any).participants?.length || 0
            const maxParticipants = event.max_participants || 0
            
            return (
              <div key={event.id} className="events-carousel__item">
                <Link href={`/events/${event.id}`} className="events-carousel__card-link">
                  <div className="events-carousel__card">
                  <div className="events-carousel__card-header">
                    <div className="events-carousel__popular-tag">
                      Populaire
                    </div>
                  </div>
                  
                  <div className="events-carousel__image">
                    {event.picture_url ? (
                      <img 
                        src={event.picture_url} 
                        alt={event.name}
                        className="events-carousel__event-image"
                      />
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <polygon points="10,8 16,12 10,16 10,8"/>
                      </svg>
                    )}
                  </div>

                  <div>
                    <h3 className="events-carousel__event-title">
                      {event.name.toUpperCase()}
                    </h3>
                    
                    <div className={`events-carousel__datetime ${!isAuthenticated ? 'blurred' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      {isAuthenticated ? formatDateTime(event.date) : 'Connectez-vous pour voir'}
                    </div>
                    
                    <div className={`events-carousel__location ${!isAuthenticated ? 'blurred' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {isAuthenticated ? event.location_name : 'Connectez-vous pour voir'}
                    </div>

                    <div className="events-carousel__participants-row">
                      <div className="events-carousel__participants-info">
                        <div className="events-carousel__avatars">
                          {(event as any).participants?.slice(0, 3).map((participant: any, i: number) => (
                            <div key={participant.id || i} className={`events-carousel__avatar events-carousel__avatar--${i + 1}`}>
                              {participant.profile_picture_url ? (
                                <img src={participant.profile_picture_url} alt={participant.name} />
                              ) : (
                                participant.name?.charAt(0).toUpperCase() || (i + 1)
                              )}
                            </div>
                          )) || [...Array(Math.min(3, participantCount || 1))].map((_, i) => (
                            <div key={i} className={`events-carousel__avatar events-carousel__avatar--${i + 1}`}>
                              {i + 1}
                            </div>
                          ))}
                          {participantCount > 3 && (
                            <div className="events-carousel__avatar events-carousel__avatar--extra">
                              +{participantCount - 3}
                            </div>
                          )}
                        </div>
                        <span className="events-carousel__participants-count">
                          {participantCount}/{maxParticipants}
                        </span>
                      </div>

                      <div className={`events-carousel__status-tag ${
                        participantCount < maxParticipants 
                          ? 'events-carousel__status-tag--available' 
                          : 'events-carousel__status-tag--full'
                      }`}>
                        {participantCount < maxParticipants ? 'PLACES LIBRES' : 'COMPLET'}
                      </div>
                    </div>
                  </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>

        <div className="events-carousel__cta">
          <Link href="/events">
            <Button variant="primary" size="lg">
              Voir tous les événements →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default EventsCarousel