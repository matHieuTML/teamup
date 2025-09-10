// Service pour la gestion hors ligne des événements
// Permet de sauvegarder et récupérer les événements inscrits en mode offline

interface CachedEvent {
  id: string
  name: string
  type: string
  description?: string
  location_name: string
  latitude?: number
  longitude?: number
  date: string // Format ISO pour la sérialisation
  picture_url?: string
  created_by: string
  level_needed?: string
  competent_trainer?: boolean
  // Métadonnées de cache
  cached_at: string
  user_role: 'participant' | 'organisateur'
  joined_at: string
}

interface OfflineEventsData {
  events: CachedEvent[]
  last_sync: string
  user_id: string
}

export class OfflineEventsService {
  private static readonly STORAGE_KEY = 'teamup_offline_events'
  private static readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 jours

  /**
   * Sauvegarde les événements de l'utilisateur pour l'accès hors ligne
   */
  static async saveUserEventsForOffline(
    userId: string,
    createdEvents: any[],
    joinedEvents: any[]
  ): Promise<void> {
    try {
      const cachedEvents: CachedEvent[] = []

      // Traiter les événements créés
      for (const event of createdEvents) {
        cachedEvents.push({
          id: event.id,
          name: event.name,
          type: event.type,
          description: event.description,
          location_name: event.location_name,
          latitude: event.latitude,
          longitude: event.longitude,
          date: this.normalizeDateToISO(event.date),
          picture_url: event.picture_url,
          created_by: event.created_by,
          level_needed: event.level_needed,
          competent_trainer: event.competent_trainer,
          cached_at: new Date().toISOString(),
          user_role: 'organisateur',
          joined_at: this.normalizeDateToISO(event.date) // Date de création comme joined_at
        })
      }

      // Traiter les événements rejoints
      for (const userEvent of joinedEvents) {
        const event = userEvent.event || userEvent
        cachedEvents.push({
          id: event.id,
          name: event.name,
          type: event.type,
          description: event.description,
          location_name: event.location_name,
          latitude: event.latitude,
          longitude: event.longitude,
          date: this.normalizeDateToISO(event.date),
          picture_url: event.picture_url,
          created_by: event.created_by,
          level_needed: event.level_needed,
          competent_trainer: event.competent_trainer,
          cached_at: new Date().toISOString(),
          user_role: 'participant',
          joined_at: this.normalizeDateToISO(userEvent.joined_at || event.date)
        })
      }

      const offlineData: OfflineEventsData = {
        events: cachedEvents,
        last_sync: new Date().toISOString(),
        user_id: userId
      }

      // Sauvegarder dans localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(offlineData))
      
      console.log(`OfflineEventsService: ${cachedEvents.length} événements sauvegardés pour l'accès hors ligne`)
      
      // Notifier l'utilisateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('TeamUp - Événements téléchargés', {
          body: `${cachedEvents.length} événements disponibles hors ligne`,
          icon: '/images/logo/ios/192.png'
        })
      }

    } catch (error) {
      console.error('OfflineEventsService: Erreur lors de la sauvegarde:', error)
      throw new Error('Impossible de sauvegarder les événements hors ligne')
    }
  }

  /**
   * Récupère les événements sauvegardés pour l'accès hors ligne
   */
  static getOfflineEvents(userId: string): OfflineEventsData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null

      const data: OfflineEventsData = JSON.parse(stored)
      
      // Vérifier que les données appartiennent au bon utilisateur
      if (data.user_id !== userId) {
        console.log('OfflineEventsService: Données d\'un autre utilisateur, nettoyage')
        this.clearOfflineEvents()
        return null
      }

      // Vérifier la fraîcheur du cache
      const lastSync = new Date(data.last_sync)
      const now = new Date()
      const cacheAge = now.getTime() - lastSync.getTime()

      if (cacheAge > this.CACHE_DURATION) {
        console.log('OfflineEventsService: Cache expiré, nettoyage')
        this.clearOfflineEvents()
        return null
      }

      return data
    } catch (error) {
      console.error('OfflineEventsService: Erreur lors de la récupération:', error)
      return null
    }
  }

  /**
   * Récupère les événements créés en mode hors ligne
   */
  static getOfflineCreatedEvents(userId: string): CachedEvent[] {
    const data = this.getOfflineEvents(userId)
    if (!data) return []
    
    return data.events.filter(event => event.user_role === 'organisateur')
  }

  /**
   * Récupère les événements rejoints en mode hors ligne
   */
  static getOfflineJoinedEvents(userId: string): CachedEvent[] {
    const data = this.getOfflineEvents(userId)
    if (!data) return []
    
    return data.events.filter(event => event.user_role === 'participant')
  }

  /**
   * Vérifie si des données hors ligne sont disponibles
   */
  static hasOfflineEvents(userId: string): boolean {
    const data = this.getOfflineEvents(userId)
    return data !== null && data.events.length > 0
  }

  /**
   * Obtient des informations sur le cache hors ligne
   */
  static getOfflineCacheInfo(userId: string): {
    hasCache: boolean
    eventCount: number
    lastSync: Date | null
    cacheAge: number
  } {
    const data = this.getOfflineEvents(userId)
    
    if (!data) {
      return {
        hasCache: false,
        eventCount: 0,
        lastSync: null,
        cacheAge: 0
      }
    }

    const lastSync = new Date(data.last_sync)
    const cacheAge = Date.now() - lastSync.getTime()

    return {
      hasCache: true,
      eventCount: data.events.length,
      lastSync,
      cacheAge
    }
  }

  /**
   * Supprime les données hors ligne
   */
  static clearOfflineEvents(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    console.log('OfflineEventsService: Cache hors ligne nettoyé')
  }

  /**
   * Normalise une date au format ISO string
   */
  private static normalizeDateToISO(date: any): string {
    if (!date) return new Date().toISOString()
    
    if (typeof date === 'string') {
      return new Date(date).toISOString()
    }
    
    if (date.seconds) {
      // Format Firestore Timestamp
      return new Date(date.seconds * 1000).toISOString()
    }
    
    if (date instanceof Date) {
      return date.toISOString()
    }
    
    return new Date().toISOString()
  }

  /**
   * Formate une date pour l'affichage
   */
  static formatEventDate(dateISO: string): string {
    const date = new Date(dateISO)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  /**
   * Formate une heure pour l'affichage
   */
  static formatEventTime(dateISO: string): string {
    const date = new Date(dateISO)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Obtient l'icône d'un type d'événement
   */
  static getEventTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'football': '⚽',
      'basketball': '🏀',
      'tennis': '🎾',
      'running': '🏃',
      'cycling': '🚴',
      'swimming': '🏊',
      'fitness': '💪',
      'yoga': '🧘',
      'climbing': '🧗',
      'hiking': '🥾',
      'volleyball': '🏐',
      'badminton': '🏸',
      'ping-pong': '🏓',
      'other': '🏃'
    }
    return icons[type] || icons['other']
  }

  /**
   * Obtient le nom d'affichage d'un type d'événement
   */
  static getEventTypeDisplay(type: string): string {
    const displays: { [key: string]: string } = {
      'football': 'Football',
      'basketball': 'Basketball',
      'tennis': 'Tennis',
      'running': 'Course à pied',
      'cycling': 'Cyclisme',
      'swimming': 'Natation',
      'fitness': 'Fitness',
      'yoga': 'Yoga',
      'climbing': 'Escalade',
      'hiking': 'Randonnée',
      'volleyball': 'Volleyball',
      'badminton': 'Badminton',
      'ping-pong': 'Ping-pong',
      'other': 'Autre sport'
    }
    return displays[type] || displays['other']
  }
}
