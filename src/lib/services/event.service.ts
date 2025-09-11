import { EventFormData, SportUtils, SportType } from '@/lib/validations/event.schema'
import { Event } from '@/types/database'

export class EventService {
  private static baseUrl = '/api/events'

  static async createEvent(formData: EventFormData, pictureUrl?: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Récupérer l'utilisateur authentifié
      const { getAuth } = await import('firebase/auth')
      const auth = getAuth()
      
      if (!auth.currentUser) {
        throw new Error('Utilisateur non authentifié')
      }

      const userId = auth.currentUser.uid

      // Combiner date et heure
      const eventDateTime = new Date(`${formData.date}T${formData.time}:00`)
      
      // Utiliser les coordonnées du formulaire ou coordonnées par défaut (Paris)
      const coordinates = {
        latitude: formData.latitude || 48.8566, // Paris par défaut
        longitude: formData.longitude || 2.3522
      }
      
      const eventData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        level_needed: formData.level_needed,
        location_name: formData.location_name,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        date: eventDateTime.toISOString(),
        max_participants: formData.max_participants,
        visibility: formData.visibility,
        competent_trainer: formData.competent_trainer,
        average_speed: formData.average_speed,
        distance: formData.distance,
        picture_url: pictureUrl,
        created_by: userId
      }

      const token = await this.getAuthToken()
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création de l\'événement')
      }

      return {
        success: true,
        eventId: result.eventId
      }
    } catch (error) {
      console.error('Erreur EventService.createEvent:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  static async updateEvent(eventId: string, formData: EventFormData, pictureUrl?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer l'utilisateur authentifié
      const { getAuth } = await import('firebase/auth')
      const auth = getAuth()
      
      if (!auth.currentUser) {
        throw new Error('Utilisateur non authentifié')
      }

      // Combiner date et heure
      const eventDateTime = new Date(`${formData.date}T${formData.time}:00`)
      
      // Utiliser les coordonnées du formulaire ou coordonnées par défaut (Paris)
      const coordinates = {
        latitude: formData.latitude || 48.8566, // Paris par défaut
        longitude: formData.longitude || 2.3522
      }
      
      const eventData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        level_needed: formData.level_needed,
        location_name: formData.location_name,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        date: eventDateTime.toISOString(),
        max_participants: formData.max_participants,
        visibility: formData.visibility,
        competent_trainer: formData.competent_trainer,
        average_speed: formData.average_speed,
        distance: formData.distance,
        picture_url: pictureUrl
      }

      const token = await this.getAuthToken()
      
      const response = await fetch(`${this.baseUrl}/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la modification')
      }

      return { success: true }
    } catch (error) {
      console.error('Erreur EventService.updateEvent:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  // Récupérer tous les événements avec filtres optionnels
  static async getEvents(filters?: {
    sportType?: SportType
    userId?: string
    limit?: number
  }): Promise<{ events: Event[]; total: number; hasMore: boolean }> {
    try {
      const params = new URLSearchParams()
      if (filters?.sportType) params.append('sportType', filters.sportType)
      if (filters?.userId) params.append('userId', filters.userId)
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`${this.baseUrl}?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la récupération des événements')
      }

      return result.data || { events: result.events || [], total: 0, hasMore: false }
    } catch (error) {
      console.error('Erreur EventService.getEvents:', error)
      return { events: [], total: 0, hasMore: false }
    }
  }

  // Récupérer un événement par son ID
  static async getEventById(eventId: string): Promise<Event | null> {
    try {
      const token = await this.getAuthToken()
      
      const response = await fetch(`${this.baseUrl}/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Événement non trouvé')
      }

      return result.data || null
    } catch (error) {
      console.error('Erreur EventService.getEventById:', error)
      return null
    }
  }

  // Récupérer les statistiques d'un événement
  static async getEventStats(eventId: string, userId: string): Promise<{
    totalParticipants: number
    organizer: any | null
    participants: any[]
    userRole: string | null
  }> {
    try {
      console.log('🔍 [SERVICE DEBUG] === getEventStats ===')
      console.log('🔍 [SERVICE DEBUG] eventId:', eventId)
      console.log('🔍 [SERVICE DEBUG] userId:', userId)
      
      const token = await this.getAuthToken()
      console.log('🔍 [SERVICE DEBUG] token obtained:', !!token)
      
      const url = `${this.baseUrl}/${eventId}/stats`
      console.log('🔍 [SERVICE DEBUG] API URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('🔍 [SERVICE DEBUG] response.ok:', response.ok)
      console.log('🔍 [SERVICE DEBUG] response.status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log('❌ [SERVICE DEBUG] API Error:', errorData)
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ [SERVICE DEBUG] API Response:', data)
      console.log('🔍 [SERVICE DEBUG] data.data:', data.data)
      return data.data
    } catch (error) {
      console.error('❌ [SERVICE DEBUG] Erreur lors de la récupération des stats de l\'événement:', error)
      throw error
    }
  }

  // Rejoindre un événement
  static async joinEvent(eventId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const token = await this.getAuthToken()
      
      const response = await fetch(`${this.baseUrl}/${eventId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const data = await response.json()
      return { success: true, message: data.message }
    } catch (error) {
      console.error('Erreur lors de l\'inscription à l\'événement:', error)
      throw error
    }
  }

  // Quitter un événement
  static async leaveEvent(eventId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const token = await this.getAuthToken()
      
      const response = await fetch(`${this.baseUrl}/${eventId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const data = await response.json()
      return { success: true, message: data.message }
    } catch (error) {
      console.error('Erreur lors de la désinscription de l\'événement:', error)
      throw error
    }
  }

  // Supprimer un événement (organisateur seulement)
  static async deleteEvent(eventId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const token = await this.getAuthToken()
      
      const response = await fetch(`${this.baseUrl}/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const data = await response.json()
      return { success: true, message: data.message }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error)
      throw error
    }
  }

  // Récupérer les événements créés par un utilisateur
  static async getUserCreatedEvents(userId: string): Promise<any[]> {
    try {
      const token = await this.getAuthToken()
      
      const response = await fetch(`${this.baseUrl}?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la récupération des événements créés')
      }

      return result.data?.events || []
    } catch (error) {
      console.error('Erreur EventService.getUserCreatedEvents:', error)
      return []
    }
  }

  // Récupérer les participations d'un utilisateur
  static async getUserParticipations(userId: string): Promise<any[]> {
    try {
      
      const response = await fetch(`/api/userEvents?userId=${userId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la récupération des participations')
      }

      return result.events || []
    } catch (error) {
      console.error('Erreur EventService.getUserParticipations:', error)
      return []
    }
  }

  // Utilitaire pour récupérer le token d'authentification
  private static async getAuthToken(): Promise<string> {
    // Utiliser Firebase Auth pour récupérer le token
    const { getAuth } = await import('firebase/auth')
    const auth = getAuth()
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié')
    }

    return await auth.currentUser.getIdToken()
  }

  // Utilitaires pour l'affichage
  static convertFirestoreDate(firestoreDate: any): Date {
    if (!firestoreDate) {
      return new Date()
    }
    
    // Si c'est déjà un objet Date
    if (firestoreDate instanceof Date) {
      return firestoreDate
    }
    
    // Si c'est un timestamp Firestore avec seconds
    if (firestoreDate && typeof firestoreDate === 'object' && 'seconds' in firestoreDate) {
      return new Date(firestoreDate.seconds * 1000)
    }
    
    // Si c'est un objet avec _seconds (autre format Firestore)
    if (firestoreDate && typeof firestoreDate === 'object' && '_seconds' in firestoreDate) {
      return new Date(firestoreDate._seconds * 1000)
    }
    
    // Si c'est une string ISO
    if (typeof firestoreDate === 'string') {
      return new Date(firestoreDate)
    }
    
    // Si c'est un nombre (timestamp en millisecondes)
    if (typeof firestoreDate === 'number') {
      return new Date(firestoreDate)
    }
    
    // Fallback
    try {
      return new Date(firestoreDate)
    } catch (error) {
      console.error('Erreur conversion date:', error)
      return new Date()
    }
  }

  // Formater une date pour l'affichage
  static formatEventDate(date: any): string {
    try {
      const jsDate = this.convertFirestoreDate(date)
      return jsDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Erreur formatage date:', error)
      return 'Date invalide'
    }
  }

  // Formater l'heure pour l'affichage
  static formatEventTime(date: any): string {
    try {
      const jsDate = this.convertFirestoreDate(date)
      return jsDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Erreur formatage heure:', error)
      return '--:--'
    }
  }

  static getEventTypeDisplay(type: string): string {
    return SportUtils.getDisplayName(type as SportType) || type
  }

  static getEventTypeIcon(type: string): string {
    return SportUtils.getIcon(type as SportType) || '🏃'
  }
}
