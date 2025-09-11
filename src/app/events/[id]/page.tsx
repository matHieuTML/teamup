'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import { EventService } from '@/lib/services/event.service'
import { EventChat } from '@/components/chat/EventChat'
import MainLayout from '@/components/layout/MainLayout'
import styles from './page.module.css'

interface EventData {
  id: string
  name: string
  type: string
  description?: string
  location_name: string
  date: Date | { seconds: number } | string
  latitude: number
  longitude: number
  level_needed?: string
  picture_url?: string
  created_by: string
  visibility: string
  competent_trainer?: boolean
  distance?: number
  average_speed?: number
  max_participants?: number
}

interface UserEvent {
  id_user: string
  id_event: string
  role: 'organisateur' | 'participant' | 'observateur'
  joined_at: Date
  user?: {
    name: string
    profile_picture_url?: string
  }
}

interface EventStats {
  totalParticipants: number
  organizer: UserEvent | null
  participants: UserEvent[]
  userRole: string | null
}

const EventDetailPage = () => {
  const params = useParams()
  const { user, loading: authLoading, isAuthenticated } = useAuthRedirect(true)
  
  const [event, setEvent] = useState<EventData | null>(null)
  const [eventStats, setEventStats] = useState<EventStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eventId = params.id as string

  useEffect(() => {
    if (!authLoading && user && isAuthenticated && eventId) {
      loadEventDetails()
    }
  }, [authLoading, user, isAuthenticated, eventId])

  const loadEventDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const eventData = await EventService.getEventById(eventId)
      if (!eventData) {
        setError('Événement non trouvé')
        return
      }
      setEvent(eventData)

      const stats = await EventService.getEventStats(eventId, user!.uid)
      setEventStats(stats)

    } catch (error) {
      console.error('Erreur lors du chargement de l\'événement:', error)
      setError('Erreur lors du chargement de l\'événement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinEvent = async () => {
    if (!user || !event) return

    try {
      setIsJoining(true)
      await EventService.joinEvent(eventId, user.uid)
      
      const stats = await EventService.getEventStats(eventId, user.uid)
      setEventStats(stats)
      
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      setError('Erreur lors de l\'inscription à l\'événement')
    } finally {
      setIsJoining(false)
    }
  }

  const formatDateTime = (dateValue: Date | { seconds: number } | string) => {
    try {
      const dateStr = EventService.formatEventDate(dateValue)
      const timeStr = EventService.formatEventTime(dateValue)
      return `${dateStr} à ${timeStr}`
    } catch (error) {
      console.error('Erreur formatage date/heure:', error)
      return 'Date non disponible'
    }
  }

  const getSportEmoji = (sport: string) => {
    const sportEmojis: { [key: string]: string } = {
      'foot': '⚽',
      'football': '⚽',
      'basket': '🏀',
      'basketball': '🏀',
      'tennis': '🎾',
      'course à pied': '🏃‍♂️',
      'running': '🏃‍♂️',
      'natation': '🏊‍♂️',
      'swimming': '🏊‍♂️'
    }
    return sportEmojis[sport.toLowerCase()] || '🏃‍♂️'
  }

  if (authLoading) {
    return (
      <MainLayout>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Vérification de l&apos;authentification...</p>
        </div>
      </MainLayout>
    )
  }

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className={styles.errorState}>
          <p>Vous devez être connecté pour voir cet événement.</p>
        </div>
      </MainLayout>
    )
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Chargement de l'événement...</p>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className={styles.errorState}>
          <p>{error}</p>
        </div>
      </MainLayout>
    )
  }

  if (!event || !eventStats) {
    return (
      <MainLayout>
        <div className={styles.errorState}>
          <p>Événement non trouvé</p>
        </div>
      </MainLayout>
    )
  }

  const isOrganizer = eventStats.userRole === 'organisateur'
  const isParticipant = eventStats.userRole === 'participant'
  
  // Vérifier si l'événement est passé
  const eventDate = EventService.convertFirestoreDate(event.date)
  const isPastEvent = eventDate < new Date()

  return (
    <MainLayout>
      <div className={styles.container}>
        {/* Image principale */}
        {event.picture_url && (
          <div className={styles.mainImage}>
            <img 
              src={event.picture_url} 
              alt={event.name}
            />
          </div>
        )}

        {/* En-tête de l'événement */}
        <div className={styles.eventHeader}>
          <div className={styles.eventType}>
            {getSportEmoji(event.type)} {event.type}
          </div>
          <h1 className={styles.eventTitle}>{event.name}</h1>
          
          {/* Organisateur */}
          {eventStats?.organizer && (
            <div className={styles.organizer}>
              {eventStats.organizer.user?.profile_picture_url ? (
                <div className={styles.organizerImage}>
                  <img
                    src={eventStats.organizer.user.profile_picture_url}
                    alt={eventStats.organizer.user.name}
                    width={40}
                    height={40}
                  />
                </div>
              ) : (
                <span className={styles.emoji}>👤</span>
              )}
              <span>Organisé par {eventStats.organizer.user?.name || 'Organisateur'}</span>
            </div>
          )}
          
          {/* Informations de l'événement */}
          <div className={styles.eventInfo}>
            <div className={styles.infoItem}>
              <span className={styles.emoji}>📅</span>
              <div>
                <strong>Date & Heure</strong>
                <p>{formatDateTime(event.date)}</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.emoji}>📍</span>
              <div>
                <strong>Lieu</strong>
                <p>{event.location_name}</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.emoji}>👥</span>
              <div>
                <strong>Participants</strong>
                <p>{eventStats.totalParticipants} {event.max_participants ? `sur ${event.max_participants}` : ''} inscrits</p>
              </div>
            </div>

            {event.level_needed && (
              <div className={styles.infoItem}>
                <span className={styles.emoji}>⭐</span>
                <div>
                  <strong>Niveau requis</strong>
                  <p>{event.level_needed}</p>
                </div>
              </div>
            )}

            {event.competent_trainer && (
              <div className={styles.infoItem}>
                <span className={styles.emoji}>🏆</span>
                <div>
                  <strong>Encadrement</strong>
                  <p>Entraîneur qualifié</p>
                </div>
              </div>
            )}

            {(event.distance || event.average_speed) && (
              <>
                {event.distance && (
                  <div className={styles.infoItem}>
                    <span className={styles.emoji}>📏</span>
                    <div>
                      <strong>Distance</strong>
                      <p>{event.distance} km</p>
                    </div>
                  </div>
                )}
                {event.average_speed && (
                  <div className={styles.infoItem}>
                    <span className={styles.emoji}>⚡</span>
                    <div>
                      <strong>Vitesse moyenne</strong>
                      <p>{event.average_speed} km/h</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Description */}
          <div className={styles.description}>
            {event.description || `Rejoignez-nous pour cette session de ${event.type} ! Une excellente occasion de pratiquer votre sport favori dans une ambiance conviviale.`}
          </div>

          {/* Participants */}
          {eventStats?.participants && eventStats.participants.length > 0 && (
            <div className={styles.participantsSection}>
              <h3>Participants ({eventStats.participants.length})</h3>
              <div className={styles.participantsList}>
                {eventStats.participants.map((participant) => (
                  <div key={participant.id_user} className={styles.participantItem}>
                    {participant.user?.profile_picture_url ? (
                      <img 
                        src={participant.user.profile_picture_url} 
                        alt={participant.user.name}
                        className={styles.participantAvatar}
                      />
                    ) : (
                      <div className={styles.participantAvatar}>
                        {participant.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span>{participant.user?.name || 'Participant'}</span>
                    {participant.role === 'organisateur' && (
                      <span className={styles.organizerBadge}>Organisateur</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton d'inscription ou statut */}
          {!isOrganizer && !isParticipant && !isPastEvent && (
            <button 
              onClick={handleJoinEvent} 
              disabled={isJoining}
              className={styles.registerButton}
            >
              {isJoining ? "Inscription en cours..." : "S'inscrire à l'événement"}
            </button>
          )}
          
          {/* Message pour événement passé */}
          {isPastEvent && !isOrganizer && !isParticipant && (
            <div className={styles.pastEventMessage}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
              </svg>
              Cet événement est terminé - Inscription fermée
            </div>
          )}

          {(isOrganizer || isParticipant) && (
            <div className={styles.registeredMessage}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
              {isOrganizer ? 'Vous organisez cet événement' : 'Vous êtes inscrit à cet événement'}
            </div>
          )}

          {/* Messages Section - Bloqué pour événements passés */}
          {(isOrganizer || isParticipant) && !isPastEvent && (
            <div className={styles.messagesSection}>
              <EventChat 
                eventId={eventId} 
                isOrganizer={isOrganizer}
                isParticipant={isParticipant}
              />
            </div>
          )}
          
          {/* Message pour événement passé - participants/organisateurs */}
          {(isOrganizer || isParticipant) && isPastEvent && (
            <div className={styles.pastEventChatMessage}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97Z" clipRule="evenodd" />
              </svg>
              Les messages sont désactivés pour cet événement terminé
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default EventDetailPage
