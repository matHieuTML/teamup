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

  const formatDate = (dateValue: any) => {
    try {
      let date: Date
      
      // Gérer différents formats de date
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        // Timestamp Firestore
        date = new Date(dateValue.seconds * 1000)
      } else if (dateValue && typeof dateValue === 'string') {
        // String ISO
        date = new Date(dateValue)
      } else if (dateValue instanceof Date) {
        // Déjà un objet Date
        date = dateValue
      } else {
        // Fallback
        date = new Date(dateValue)
      }
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date non disponible'
      }
      
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch (error) {
      console.error('Erreur formatage date:', error)
      return 'Date non disponible'
    }
  }

  const getSportEmoji = (sport: string) => {
    const sportEmojis: { [key: string]: string } = {
      'football': '⚽',
      'basketball': '🏀',
      'tennis': '🎾',
      'running': '🏃',
      'cycling': '🚴',
      'swimming': '🏊',
      'volleyball': '🏐',
      'badminton': '🏸',
      'default': '🏃'
    }
    return sportEmojis[sport.toLowerCase()] || sportEmojis.default
  }

  if (authLoading) {
    return (
      <MainLayout>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Vérification de l'authentification...</p>
        </div>
      </MainLayout>
    )
  }

  if (!isAuthenticated) {
    return null // useAuthRedirect(true) gère la redirection automatiquement
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className={styles.eventDetail}>
          <div className={styles.loading}>
            Chargement de l'événement...
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className={styles.eventDetail}>
          <div className={styles.error}>
            {error}
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!event) {
    return (
      <MainLayout>
        <div className={styles.eventDetail}>
          <div className={styles.error}>
            Événement non trouvé
          </div>
        </div>
      </MainLayout>
    )
  }

  const isOrganizer = eventStats?.userRole === 'organisateur'
  const isParticipant = eventStats?.userRole === 'participant'
  const canJoin = !isOrganizer && !isParticipant

  // Logs de debug pour la logique de rôle
  console.log('🎯 [DEBUG] === LOGIQUE DE RÔLE ===')
  console.log('🎯 [DEBUG] eventStats:', eventStats)
  console.log('🎯 [DEBUG] eventStats?.userRole:', eventStats?.userRole)
  console.log('🎯 [DEBUG] isOrganizer:', isOrganizer)
  console.log('🎯 [DEBUG] isParticipant:', isParticipant)
  console.log('🎯 [DEBUG] canJoin:', canJoin)
  console.log('🎯 [DEBUG] user.uid:', user?.uid)
  console.log('🎯 [DEBUG] event?.created_by:', event?.created_by)
  console.log('🎯 [DEBUG] user.uid === event?.created_by:', user?.uid === event?.created_by)
  console.log('🎯 [DEBUG] =========================')

  return (
    <MainLayout>
      <div className={styles.eventDetail}>
        {/* Hero Section */}
        <div className={styles.heroSection}>
          {event.picture_url && (
            <img 
              src={event.picture_url} 
              alt={event.name}
              className={styles.heroImage}
            />
          )}
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <h1 className={styles.eventTitle}>{event.name}</h1>
            <p className={styles.eventSubtitle}>
              {getSportEmoji(event.type)} {event.type} • {event.location_name}
            </p>
          </div>
        </div>

        <div className={styles.contentContainer}>
          {/* Quick Info Bar */}
          <div className={styles.quickInfoBar}>
            <div className={styles.quickInfoItem}>
              <div className={styles.quickInfoIcon}>📅</div>
              <div className={styles.quickInfoText}>
                <p className={styles.quickInfoLabel}>Date & Heure</p>
                <p className={styles.quickInfoValue}>{formatDate(event.date)}</p>
              </div>
            </div>
            
            <div className={styles.quickInfoItem}>
              <div className={styles.quickInfoIcon}>👥</div>
              <div className={styles.quickInfoText}>
                <p className={styles.quickInfoLabel}>Participants</p>
                <p className={styles.quickInfoValue}>
                  {eventStats?.totalParticipants || 0} inscrits
                </p>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>👥</div>
              <div className={styles.infoContent}>
                <h3>Participants</h3>
                <p>{eventStats?.totalParticipants || 0} inscrits</p>
              </div>
            </div>

            {event.level_needed && (
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>⭐</div>
                <div className={styles.infoContent}>
                  <h3>Niveau requis</h3>
                  <p>{event.level_needed}</p>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className={styles.mainContent}>
            {/* Description Section */}
            <div className={styles.descriptionSection}>
              <h2 className={styles.sectionTitle}>À propos de cet événement</h2>
              {event.description ? (
                <p className={styles.description}>{event.description}</p>
              ) : (
                <p className={styles.description}>
                  Rejoignez-nous pour cette session de {event.type} ! 
                  Une excellente occasion de pratiquer votre sport favori dans une ambiance conviviale.
                </p>
              )}
              
              {/* Additional Info */}
              {(event.distance || event.average_speed) && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '12px' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                    Informations complémentaires
                  </h3>
                  {event.distance && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                      📏 Distance : {event.distance} km
                    </p>
                  )}
                  {event.average_speed && (
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                      ⚡ Vitesse moyenne : {event.average_speed} km/h
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Stats Sidebar */}
            <div className={styles.statsSidebar}>
              {/* Event Stats */}
              <div className={styles.statsCard}>
                <h3 className={styles.sectionTitle}>Statistiques</h3>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <p className={styles.statNumber}>{eventStats?.totalParticipants || 0}</p>
                    <p className={styles.statLabel}>Participants</p>
                  </div>
                  <div className={styles.statItem}>
                    <p className={styles.statNumber}>
                      {event.max_participants || '∞'}
                    </p>
                    <p className={styles.statLabel}>Places max</p>
                  </div>
                  <div className={styles.statItem}>
                    <p className={styles.statNumber}>
                      {event.visibility === 'public' ? 'Public' : 'Privé'}
                    </p>
                    <p className={styles.statLabel}>Visibilité</p>
                  </div>
                  <div className={styles.statItem}>
                    <p className={styles.statNumber}>
                      {formatDate(event.date).split(' ')[0]}
                    </p>
                    <p className={styles.statLabel}>Date</p>
                  </div>
                </div>
              </div>

              {/* Organizer Info */}
              {eventStats?.organizer && (
                <div className={styles.statsCard}>
                  <h3 className={styles.sectionTitle}>Organisateur</h3>
                  <div className={styles.participantCard}>
                    {eventStats.organizer.user?.profile_picture_url ? (
                      <img 
                        src={eventStats.organizer.user.profile_picture_url} 
                        alt={eventStats.organizer.user.name}
                        className={styles.participantAvatar}
                      />
                    ) : (
                      <div className={styles.participantAvatar}>
                        {eventStats.organizer.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className={styles.participantInfo}>
                      <p className={styles.participantName}>
                        {eventStats.organizer.user?.name || 'Organisateur'}
                      </p>
                      <span className={styles.organizerBadge}>Organisateur</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Participants Section */}
          {eventStats?.participants && eventStats.participants.length > 0 && (
            <div className={styles.participantsSection}>
              <h2 className={styles.sectionTitle}>
                Participants ({eventStats.participants.length})
              </h2>
              <div className={styles.participantsList}>
                {eventStats.participants.map((participant) => (
                  <div key={participant.id_user} className={styles.participantCard}>
                    {participant.user?.profile_picture_url ? (
                      <img 
                        src={participant.user.profile_picture_url} 
                        alt={participant.user.name}
                        className={styles.userAvatarMedium}
                      />
                    ) : (
                      <div className={styles.userAvatarMediumDefault}>
                        {participant.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className={styles.userMainInfo}>
                      <h3>{participant.user?.name || 'Utilisateur'}</h3>
                      <div className={styles.roleBadge}>{participant.role}</div>
                      {(participant.user as any)?.location && (
                        <p className={styles.userLocation}> {(participant.user as any).location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
              </div>
            </div>

            {/* Niveau requis */}
            {event.level_needed && (
              <div className={styles.statCard}>
                <span className={styles.statIcon}>📈</span>
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{event.level_needed}</span>
                  <span className={styles.statLabel}>Niveau requis</span>
                </div>
              </div>
            )}

            {/* Entraîneur compétent */}
            {event.competent_trainer && (
              <div className={styles.statCard}>
                <span className={styles.statIcon}>🏆</span>
                <div className={styles.statContent}>
                  <span className={styles.statValue}>Oui</span>
                  <span className={styles.statLabel}>Entraîneur compétent</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Organisateur enrichi */}
        {eventStats?.organizer && (
          <div className={styles.organizerSection}>
            <h2>👑 Organisateur</h2>
            <div className={styles.userCardEnhanced}>
              <div className={styles.userHeader}>
                {eventStats.organizer.user?.profile_picture_url ? (
                  <img 
                    src={eventStats.organizer.user.profile_picture_url} 
                    alt={eventStats.organizer.user.name}
                    className={styles.userAvatarLarge}
                  />
                ) : (
                  <div className={styles.userAvatarLargeDefault}>
                    {eventStats.organizer.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className={styles.userMainInfo}>
                  <h3>{eventStats.organizer.user?.name || 'Utilisateur'}</h3>
                  <div className={styles.roleBadge}>Organisateur</div>
                  {(eventStats.organizer.user as any)?.location && (
                    <p className={styles.userLocation}> {(eventStats.organizer.user as any).location}</p>
                  )}
                </div>
              </div>
              
              <div className={styles.userStats}>
                <div className={styles.userStatItem}>
                  <span className={styles.userStatValue}>{(eventStats.organizer.user as any)?.number_event_created || 0}</span>
                  <span className={styles.userStatLabel}>Événements créés</span>
                </div>
                <div className={styles.userStatItem}>
                  <span className={styles.userStatValue}>{(eventStats.organizer.user as any)?.number_event_joined || 0}</span>
                  <span className={styles.userStatLabel}>Événements rejoints</span>
                </div>
                <div className={styles.userStatItem}>
                  <span className={styles.userStatValue}>{formatDate(eventStats.organizer.joined_at).split(' ')[0]}</span>
                  <span className={styles.userStatLabel}>Créé le</span>
                </div>
              </div>

              {(eventStats.organizer.user as any)?.sports_preferences && (
                <div className={styles.userSports}>
                  <span className={styles.sportsLabel}>Sports pratiqués :</span>
                  <div className={styles.sportsTags}>
                    {JSON.parse((eventStats.organizer.user as any).sports_preferences).map((sport: any, index: number) => (
                      <span key={index} className={styles.sportTag}>
                        {getSportEmoji(sport.sport)} {sport.sport} ({sport.niveau})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Participants enrichis */}
        {eventStats && eventStats.participants.length > 0 && (
          <div className={styles.participantsSection}>
            <h2>👥 Participants ({eventStats.participants.length})</h2>
            
            {/* Timeline des inscriptions */}
            <div className={styles.joinTimeline}>
              <h3>📅 Timeline des inscriptions</h3>
              <div className={styles.timelineList}>
                {[...eventStats.participants]
                  .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())
                  .map((participant, index) => (
                    <div key={participant.id_user} className={styles.timelineItem}>
                      <span className={styles.timelineNumber}>{index + 1}</span>
                      <span className={styles.timelineName}>{participant.user?.name}</span>
                      <span className={styles.timelineDate}>{formatDate(participant.joined_at).split(' à ')[0]}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Liste détaillée des participants */}
            <div className={styles.participantsList}>
              {eventStats.participants.map((participant) => {
                const age = (participant.user as any)?.birth_date ? 
                  new Date().getFullYear() - new Date((participant.user as any).birth_date).getFullYear() : null
                
                return (
                  <div key={participant.id_user} className={styles.userCardEnhanced}>
                    <div className={styles.userHeader}>
                      {participant.user?.profile_picture_url ? (
                        <img 
                          src={participant.user.profile_picture_url} 
                          alt={participant.user.name}
                          className={styles.userAvatarMedium}
                        />
                      ) : (
                        <div className={styles.userAvatarMediumDefault}>
                          {participant.user?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className={styles.userMainInfo}>
                        <h3>{participant.user?.name || 'Utilisateur'}</h3>
                        <div className={styles.roleBadge}>{participant.role}</div>
                        {(participant.user as any)?.location && (
                          <p className={styles.userLocation}>📍 {(participant.user as any).location}</p>
                        )}
                        {age && (
                          <p className={styles.userAge}>🎂 {age} ans</p>
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.userStats}>
                      <div className={styles.userStatItem}>
                        <span className={styles.userStatValue}>{(participant.user as any)?.number_event_created || 0}</span>
                        <span className={styles.userStatLabel}>Créés</span>
                      </div>
                      <div className={styles.userStatItem}>
                        <span className={styles.userStatValue}>{(participant.user as any)?.number_event_joined || 0}</span>
                        <span className={styles.userStatLabel}>Rejoints</span>
                      </div>
                      <div className={styles.userStatItem}>
                        <span className={styles.userStatValue}>{formatDate(participant.joined_at).split(' ')[0]}</span>
                        <span className={styles.userStatLabel}>Inscrit le</span>
                      </div>
                    </div>

                    {(participant.user as any)?.sports_preferences && (
                      <div className={styles.userSports}>
                        <span className={styles.sportsLabel}>Niveau dans ce sport :</span>
                        <div className={styles.sportsTags}>
                          {JSON.parse((participant.user as any).sports_preferences)
                            .filter((sport: any) => sport.sport.toLowerCase() === event.type.toLowerCase())
                            .map((sport: any, index: number) => (
                              <span key={index} className={styles.sportTagHighlight}>
                                {getSportEmoji(sport.sport)} {sport.niveau}
                              </span>
                            ))
                          }
                          {JSON.parse((participant.user as any).sports_preferences)
                            .filter((sport: any) => sport.sport.toLowerCase() !== event.type.toLowerCase())
                            .slice(0, 2)
                            .map((sport: any, index: number) => (
                              <span key={index} className={styles.sportTag}>
                                {getSportEmoji(sport.sport)} {sport.sport}
                              </span>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Section messages ou bouton d'inscription */}
        {(isOrganizer || isParticipant) ? (
          <div className={styles.messagesSection}>
            <EventChat 
              eventId={event.id}
              isOrganizer={isOrganizer}
              isParticipant={isParticipant}
            />
          </div>
        ) : (
          <div className={styles.actionSection}>
            <button 
              onClick={handleJoinEvent}
              disabled={isJoining}
              className={styles.joinButton}
            >
              {isJoining ? 'Inscription en cours...' : 'Rejoindre l\'événement'}
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default EventDetailPage
