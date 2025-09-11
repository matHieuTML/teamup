'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import { useAuth } from '@/contexts/AuthContext'
import { EventService } from '@/lib/services/event.service'
import { OfflineEventsService } from '@/lib/services/offline-events.service'
import { OfflineButton } from '@/components/offline/OfflineButton'
import { usePWA } from '@/components/pwa/PWAInstaller'
import styles from './places.module.css'

interface UserEvent {
  id: string
  role: string
  joined_at: Date | { seconds: number } | string
  event: {
    id: string
    name: string
    type: string
    location_name: string
    date: Date | { seconds: number } | string
    picture_url?: string
    created_by: string
  }
}

interface CreatedEvent {
  id: string
  name: string
  type: string
  location_name: string
  date: Date | { seconds: number } | string
  picture_url?: string
  created_by: string
}

export default function PlacesPage() {
  const { loading: authLoading, isAuthenticated } = useAuthRedirect(true)
  const { user } = useAuth()
  const { isOnline } = usePWA()
  const router = useRouter()
  
  const [createdEvents, setCreatedEvents] = useState<CreatedEvent[]>([])
  const [joinedEvents, setJoinedEvents] = useState<UserEvent[]>([])
  const [pastCreatedEvents, setPastCreatedEvents] = useState<CreatedEvent[]>([])
  const [pastJoinedEvents, setPastJoinedEvents] = useState<UserEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [showPastEvents, setShowPastEvents] = useState(false)

  const loadUserEvents = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      setIsOfflineMode(false)
      
      if (isOnline) {
        // Mode en ligne : charger depuis l'API
        const [created, joined] = await Promise.all([
          EventService.getUserCreatedEvents(user.uid),
          EventService.getUserParticipations(user.uid)
        ])
        
        // Séparer les événements futurs et passés
        const now = new Date()
        
        const futureCreated = created.filter(event => {
          const eventDate = EventService.convertFirestoreDate(event.date)
          return eventDate >= now
        })
        
        const pastCreated = created.filter(event => {
          const eventDate = EventService.convertFirestoreDate(event.date)
          return eventDate < now
        })
        
        const filteredJoined = joined.filter(ue => ue.role !== 'organisateur')
        const futureJoined = filteredJoined.filter(ue => {
          const eventDate = EventService.convertFirestoreDate(ue.event.date)
          return eventDate >= now
        })
        
        const pastJoined = filteredJoined.filter(ue => {
          const eventDate = EventService.convertFirestoreDate(ue.event.date)
          return eventDate < now
        })
        
        setCreatedEvents(futureCreated)
        setJoinedEvents(futureJoined)
        setPastCreatedEvents(pastCreated)
        setPastJoinedEvents(pastJoined)
      } else {
        // Mode hors ligne : charger depuis le cache local
        const offlineCreated = OfflineEventsService.getOfflineCreatedEvents(user.uid)
        const offlineJoined = OfflineEventsService.getOfflineJoinedEvents(user.uid)
        
        if (offlineCreated.length > 0 || offlineJoined.length > 0) {
          // Convertir les événements cachés au format attendu
          setCreatedEvents(offlineCreated.map(event => ({
            id: event.id,
            name: event.name,
            type: event.type,
            location_name: event.location_name,
            date: event.date,
            picture_url: event.picture_url,
            created_by: event.created_by
          })))
          
          setJoinedEvents(offlineJoined.map(event => ({
            id: `offline_${event.id}`,
            role: 'participant',
            joined_at: event.joined_at,
            event: {
              id: event.id,
              name: event.name,
              type: event.type,
              location_name: event.location_name,
              date: event.date,
              picture_url: event.picture_url,
              created_by: event.created_by
            }
          })))
          
          setIsOfflineMode(true)
        } else {
          setError('Aucun événement disponible hors ligne. Connectez-vous pour télécharger vos événements.')
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement des événements:', err)
      
      // En cas d'erreur en ligne, essayer le mode hors ligne
      if (isOnline) {
        const offlineCreated = OfflineEventsService.getOfflineCreatedEvents(user.uid)
        const offlineJoined = OfflineEventsService.getOfflineJoinedEvents(user.uid)
        
        if (offlineCreated.length > 0 || offlineJoined.length > 0) {
          setCreatedEvents(offlineCreated.map(event => ({
            id: event.id,
            name: event.name,
            type: event.type,
            location_name: event.location_name,
            date: event.date,
            picture_url: event.picture_url,
            created_by: event.created_by
          })))
          
          setJoinedEvents(offlineJoined.map(event => ({
            id: `offline_${event.id}`,
            role: 'participant',
            joined_at: event.joined_at,
            event: {
              id: event.id,
              name: event.name,
              type: event.type,
              location_name: event.location_name,
              date: event.date,
              picture_url: event.picture_url,
              created_by: event.created_by
            }
          })))
          
          setIsOfflineMode(true)
          setError('Connexion limitée - Affichage des événements hors ligne')
        } else {
          setError('Impossible de charger vos événements')
        }
      } else {
        setError('Aucun événement disponible hors ligne')
      }
    } finally {
      setLoading(false)
    }
  }, [user, isOnline])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserEvents()
    }
  }, [isAuthenticated, user, loadUserEvents])

  const handleLeaveEvent = async (eventId: string, eventName: string) => {
    if (!user || !confirm(`Êtes-vous sûr de vouloir quitter "${eventName}" ?`)) return
    
    try {
      setActionLoading(eventId)
      await EventService.leaveEvent(eventId, user.uid)
      
      // Recharger les événements
      await loadUserEvents()
    } catch (err) {
      console.error('Erreur lors de la désinscription:', err)
      alert('Erreur lors de la désinscription')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement "${eventName}" ?\n\nCette action est irréversible et supprimera également tous les participants et messages.`)) return
    
    try {
      setActionLoading(eventId)
      await EventService.deleteEvent(eventId)
      
      // Recharger les événements
      await loadUserEvents()
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      alert('Erreur lors de la suppression de l\'événement')
    } finally {
      setActionLoading(null)
    }
  }

  const navigateToEvent = (eventId: string) => {
    router.push(`/events/${eventId}`)
  }

  const formatDate = (date: Date | { seconds: number } | string): string => {
    if (isOfflineMode && typeof date === 'string') {
      return OfflineEventsService.formatEventDate(date)
    }
    return EventService.formatEventDate(date)
  }

  const formatTime = (date: Date | { seconds: number } | string): string => {
    if (isOfflineMode && typeof date === 'string') {
      return OfflineEventsService.formatEventTime(date)
    }
    return EventService.formatEventTime(date)
  }

  const getEventIcon = (type: string): string => {
    if (isOfflineMode) {
      return OfflineEventsService.getEventTypeIcon(type)
    }
    return EventService.getEventTypeIcon(type)
  }

  const getEventTypeDisplay = (type: string): string => {
    if (isOfflineMode) {
      return OfflineEventsService.getEventTypeDisplay(type)
    }
    return EventService.getEventTypeDisplay(type)
  }

  if (authLoading) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.loading}>
            <p>Chargement...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (authLoading) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.loading}>
            <p>Chargement...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <MainLayout>
      <div className={styles.container}>
        {/* Section offline PWA */}
        {user && (
          <div className={styles.offlineSection}>
            <div className={styles.offlineSectionContent}>
              <h3 className={styles.offlineTitle}>Accès hors ligne</h3>
              <p className={styles.offlineDescription}>
                Téléchargez vos événements pour y accéder sans connexion
              </p>
              <OfflineButton
                userId={user.uid}
                createdEvents={createdEvents}
                joinedEvents={joinedEvents.map(ue => ue.event)}
                onDownloadComplete={() => {
                  console.log('Événements téléchargés pour l\'accès hors ligne')
                }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>
            <p>Chargement de vos événements...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={loadUserEvents} className={styles.retryButton}>
              Réessayer
            </button>
          </div>
        ) : (
          <div className={styles.content}>
            {/* Événements créés */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>👑</span>
                  Événements créés
                  <span className={styles.badge}>{createdEvents.length}</span>
                </h2>
              </div>
              
              {createdEvents.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Vous n&apos;avez encore créé aucun événement</p>
                  <button 
                    onClick={() => router.push('/create')}
                    className={styles.createButton}
                  >
                    Créer mon premier événement
                  </button>
                </div>
              ) : (
                <div className={styles.eventGrid}>
                  {createdEvents.map((event) => (
                    <div key={event.id} className={styles.eventCard}>
                      <div 
                        className={styles.eventContent}
                        onClick={() => navigateToEvent(event.id)}
                      >
                        <div className={styles.eventImage}>
                          {event.picture_url ? (
                            <img src={event.picture_url} alt={event.name} />
                          ) : (
                            <div className={styles.eventImagePlaceholder}>
                              <span className={styles.eventTypeIcon}>
                                {getEventIcon(event.type)}
                              </span>
                            </div>
                          )}
                          

                        </div>
                        
                        <div className={styles.eventInfo}>
                          <h3 className={styles.eventName}>{event.name}</h3>
                          <p className={styles.eventType}>
                            {getEventTypeDisplay(event.type)}
                          </p>
                          <p className={styles.eventLocation}>
                            📍 {event.location_name}
                          </p>
                          <div className={styles.eventDateTime}>
                            <span className={styles.eventDate}>
                              {formatDate(event.date)}
                            </span>
                            <span className={styles.eventTime}>
                              {formatTime(event.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.eventActions}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/events/${event.id}/edit`)
                          }}
                          className={styles.editButton}
                          disabled={actionLoading === event.id}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEvent(event.id, event.name)
                          }}
                          className={styles.deleteButton}
                          disabled={actionLoading === event.id}
                        >
                          {actionLoading === event.id ? '...' : '🗑️ Supprimer'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Événements rejoints */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>✅</span>
                  Événements rejoints
                  <span className={styles.badge}>{joinedEvents.length}</span>
                </h2>
              </div>
              
              {joinedEvents.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Vous ne participez encore à aucun événement</p>
                  <button 
                    onClick={() => router.push('/events')}
                    className={styles.createButton}
                  >
                    Découvrir les événements
                  </button>
                </div>
              ) : (
                <div className={styles.eventGrid}>
                  {joinedEvents.map((userEvent) => (
                    <div key={userEvent.id} className={styles.eventCard}>
                      <div 
                        className={styles.eventContent}
                        onClick={() => navigateToEvent(userEvent.event.id)}
                      >
                        <div className={styles.eventImage}>
                          {userEvent.event.picture_url ? (
                            <img src={userEvent.event.picture_url} alt={userEvent.event.name} />
                          ) : (
                            <div className={styles.eventImagePlaceholder}>
                              <span className={styles.eventTypeIcon}>
                                {getEventIcon(userEvent.event.type)}
                              </span>
                            </div>
                          )}
                          

                        </div>
                        
                        <div className={styles.eventInfo}>
                          <h3 className={styles.eventName}>{userEvent.event.name}</h3>
                          <p className={styles.eventType}>
                            {getEventTypeDisplay(userEvent.event.type)}
                          </p>
                          <p className={styles.eventLocation}>
                            📍 {userEvent.event.location_name}
                          </p>
                          <div className={styles.eventDateTime}>
                            <span className={styles.eventDate}>
                              {formatDate(userEvent.event.date)}
                            </span>
                            <span className={styles.eventTime}>
                              {formatTime(userEvent.event.date)}
                            </span>
                          </div>
                          <p className={styles.joinedDate}>
                            Inscrit le {formatDate(userEvent.joined_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className={styles.eventActions}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLeaveEvent(userEvent.event.id, userEvent.event.name)
                          }}
                          className={styles.leaveButton}
                          disabled={actionLoading === userEvent.event.id}
                        >
                          {actionLoading === userEvent.event.id ? '...' : '❌ Se désinscrire'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section événements passés - Menu déroulant */}
            {(pastCreatedEvents.length > 0 || pastJoinedEvents.length > 0) && (
              <section className={styles.pastEventsSection}>
                <div className={styles.pastEventsHeader}>
                  <button
                    onClick={() => setShowPastEvents(!showPastEvents)}
                    className={styles.pastEventsToggle}
                    type="button"
                  >
                    <span className={styles.pastEventsIcon}>📅</span>
                    <span className={styles.pastEventsTitle}>
                      Événements passés ({pastCreatedEvents.length + pastJoinedEvents.length})
                    </span>
                    <span className={`${styles.chevron} ${showPastEvents ? styles.chevronUp : styles.chevronDown}`}>
                      ▼
                    </span>
                  </button>
                </div>

                {showPastEvents && (
                  <div className={styles.pastEventsContent}>
                    {/* Événements passés créés */}
                    {pastCreatedEvents.length > 0 && (
                      <div className={styles.pastEventCategory}>
                        <h3 className={styles.pastCategoryTitle}>
                          <span className={styles.sectionIcon}>👑</span>
                          Événements créés ({pastCreatedEvents.length})
                        </h3>
                        <div className={styles.pastEventGrid}>
                          {pastCreatedEvents.map((event) => (
                            <div key={event.id} className={styles.pastEventCard}>
                              <div 
                                className={styles.pastEventContent}
                                onClick={() => navigateToEvent(event.id)}
                              >
                                <div className={styles.pastEventImage}>
                                  {event.picture_url ? (
                                    <img src={event.picture_url} alt={event.name} />
                                  ) : (
                                    <div className={styles.pastEventImagePlaceholder}>
                                      <span className={styles.eventTypeIcon}>
                                        {getEventIcon(event.type)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className={styles.pastEventInfo}>
                                  <h4 className={styles.pastEventName}>{event.name}</h4>
                                  <p className={styles.pastEventType}>
                                    {getEventTypeDisplay(event.type)}
                                  </p>
                                  <p className={styles.pastEventLocation}>
                                    📍 {event.location_name}
                                  </p>
                                  <div className={styles.pastEventDateTime}>
                                    <span className={styles.pastEventDate}>
                                      {formatDate(event.date)}
                                    </span>
                                    <span className={styles.pastEventTime}>
                                      {formatTime(event.date)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Événements passés rejoints */}
                    {pastJoinedEvents.length > 0 && (
                      <div className={styles.pastEventCategory}>
                        <h3 className={styles.pastCategoryTitle}>
                          <span className={styles.sectionIcon}>✅</span>
                          Événements rejoints ({pastJoinedEvents.length})
                        </h3>
                        <div className={styles.pastEventGrid}>
                          {pastJoinedEvents.map((userEvent) => (
                            <div key={userEvent.id} className={styles.pastEventCard}>
                              <div 
                                className={styles.pastEventContent}
                                onClick={() => navigateToEvent(userEvent.event.id)}
                              >
                                <div className={styles.pastEventImage}>
                                  {userEvent.event.picture_url ? (
                                    <img src={userEvent.event.picture_url} alt={userEvent.event.name} />
                                  ) : (
                                    <div className={styles.pastEventImagePlaceholder}>
                                      <span className={styles.eventTypeIcon}>
                                        {getEventIcon(userEvent.event.type)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className={styles.pastEventInfo}>
                                  <h4 className={styles.pastEventName}>{userEvent.event.name}</h4>
                                  <p className={styles.pastEventType}>
                                    {getEventTypeDisplay(userEvent.event.type)}
                                  </p>
                                  <p className={styles.pastEventLocation}>
                                    📍 {userEvent.event.location_name}
                                  </p>
                                  <div className={styles.pastEventDateTime}>
                                    <span className={styles.pastEventDate}>
                                      {formatDate(userEvent.event.date)}
                                    </span>
                                    <span className={styles.pastEventTime}>
                                      {formatTime(userEvent.event.date)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}