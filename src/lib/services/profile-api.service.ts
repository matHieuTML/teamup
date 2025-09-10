import { auth } from '@/lib/firebase'
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { User, SportPreference } from '@/types/database'

export interface CreateUserProfileData {
  id: string
  email: string
  name: string
  birth_date?: Date
  location?: string
  sports_preferences?: SportPreference[]
}

export interface UpdateUserProfileData {
  name?: string
  birth_date?: Date
  location?: string
  sports_preferences?: SportPreference[]
  profile_picture_url?: string
  notifications_enabled?: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ProfileApiService {
  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }
    return await user.getIdToken()
  }

  private async makeRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const token = await this.getAuthToken()
      
      const response = await fetch(`/api/profile${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      })

      const data: ApiResponse<T> = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Erreur API: ${response.status}`)
      }

      return data.data as T
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error)
      throw error
    }
  }

  // Créer un nouveau profil utilisateur
  async createUserProfile(userData: CreateUserProfileData): Promise<User> {
    return this.makeRequest<User>('', {
      method: 'POST',
      body: JSON.stringify({
        name: userData.name,
        location: userData.location,
        sports_preferences: userData.sports_preferences || []
      })
    })
  }

  // Récupérer le profil utilisateur
  async getUserProfile(): Promise<User | null> {
    try {
      // Essayer d'abord l'API
      return await this.makeRequest<User>('')
    } catch (error: any) {
      console.warn('API échouée, fallback vers Firestore direct:', error.message)
      
      // Fallback : accès direct à Firestore (lecture seule)
      const user = auth.currentUser
      if (user) {
        try {
          // Attendre que l'utilisateur soit complètement authentifié
          await user.getIdToken(true) // Force refresh du token
          
          const db = getFirestore()
          const docRef = doc(db, 'users', user.uid)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists()) {
            const userData = docSnap.data()
            return {
              id: user.uid,
              email: user.email || '',
              name: userData.name || user.displayName || 'Utilisateur',
              birth_date: userData.birth_date?.toDate?.() || userData.birth_date,
              location: userData.location || '',
              sports_preferences: userData.sports_preferences || [],
              number_event_created: userData.number_event_created || 0,
              number_event_joined: userData.number_event_joined || 0,
              number_message_sent: userData.number_message_sent || 0,
              notifications_enabled: userData.notifications_enabled ?? true,
              profile_picture_url: userData.profile_picture_url || '',
              created_at: userData.created_at?.toDate?.() || new Date(),
              updated_at: userData.updated_at?.toDate?.() || new Date(),
              deleted_at: userData.deleted_at?.toDate?.() || null
            } as User
          } else {
            // Créer un profil basique si inexistant
            const newProfile: Partial<User> = {
              id: user.uid,
              email: user.email || '',
              name: user.displayName || user.email?.split('@')[0] || 'Utilisateur',
              location: '',
              sports_preferences: [],
              number_event_created: 0,
              number_event_joined: 0,
              number_message_sent: 0,
              notifications_enabled: true,
              profile_picture_url: '',
              created_at: new Date(),
              updated_at: new Date(),
              deleted_at: undefined
            }
            
            // Sauvegarder le profil basique
            await setDoc(docRef, {
              ...newProfile,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp()
            })
            
            return newProfile as User
          }
        } catch (firestoreError) {
          console.error('Erreur Firestore direct:', firestoreError)
        }
      }
      
      // Si tout échoue, retourner null
      return null
    }
  }

  // Mettre à jour le profil utilisateur
  async updateUserProfile(updates: UpdateUserProfileData): Promise<User> {
    return this.makeRequest<User>('', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }

  // Mettre à jour la photo de profil
  async updateProfilePicture(pictureUrl: string): Promise<{ picture_url: string; updated_at: string }> {
    return this.makeRequest('/picture', {
      method: 'POST',
      body: JSON.stringify({ picture_url: pictureUrl })
    })
  }

  // Supprimer la photo de profil
  async deleteProfilePicture(): Promise<void> {
    await this.makeRequest('/picture', {
      method: 'DELETE'
    })
  }

  // Mettre à jour les préférences sportives
  async updateSportsPreferences(sportsPreferences: SportPreference[]): Promise<{ sports_preferences: SportPreference[]; updated_at: string }> {
    return this.makeRequest('/sports', {
      method: 'PATCH',
      body: JSON.stringify({ sports_preferences: sportsPreferences })
    })
  }

  // Ajouter un sport aux préférences
  async addSportPreference(sport: SportPreference): Promise<{ sports_preferences: SportPreference[]; added_sport: SportPreference }> {
    return this.makeRequest('/sports', {
      method: 'POST',
      body: JSON.stringify(sport)
    })
  }

  // Obtenir les informations sur les sports disponibles
  async getAvailableSports(): Promise<{
    availableSports: { type: string; displayName: string }[]
    availableLevels: { type: string; displayName: string }[]
    maxSportsAllowed: number
  }> {
    return this.makeRequest('/sports')
  }

  // Statistiques utilisateur (calculées côté client pour l'instant)
  async getUserStats(user: User): Promise<{
    eventsCreated: number
    eventsJoined: number
    messagesSent: number
    memberSince: Date
  }> {
    return {
      eventsCreated: user.number_event_created,
      eventsJoined: user.number_event_joined,
      messagesSent: user.number_message_sent,
      memberSince: user.created_at
    }
  }

  // Vérifier si un profil existe
  async profileExists(): Promise<boolean> {
    try {
      const profile = await this.getUserProfile()
      return profile !== null && !profile.deleted_at
    } catch (error) {
      return false
    }
  }

  // Utilitaires pour les noms d'affichage
  static getSportDisplayName(sport: string): string {
    const displayNames: Record<string, string> = {
      'foot': 'Football',
      'course': 'Course à pied',
      'tennis': 'Tennis',
      'basket': 'Basketball',
      'natation': 'Natation'
    }
    return displayNames[sport] || sport
  }

  static getLevelDisplayName(level: string): string {
    const displayNames: Record<string, string> = {
      'debutant': 'Débutant',
      'intermediaire': 'Intermédiaire',
      'confirme': 'Confirmé',
      'expert': 'Expert'
    }
    return displayNames[level] || level
  }

  static getAllSportTypes(): string[] {
    return ['foot', 'course', 'tennis', 'basket', 'natation']
  }

  static getAllSportLevels(): string[] {
    return ['debutant', 'intermediaire', 'confirme', 'expert']
  }

  static createSportPreference(sport: string, level: string): SportPreference {
    return { 
      sport: sport as SportPreference['sport'], 
      level: level as SportPreference['level']
    }
  }
}

export const profileApiService = new ProfileApiService()