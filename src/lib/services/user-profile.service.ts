// Compatibilité avec les imports existants
import { profileApiService } from './profile-api.service'
import { User, SportPreference, SportType, SportLevel } from '@/types/database'

export { 
  type CreateUserProfileData,
  type UpdateUserProfileData 
} from './profile-api.service'

export interface UserStats {
  eventsCreated: number
  eventsJoined: number
  messagesSent: number
  memberSince: Date
}

// Classe wrapper pour maintenir la compatibilité avec l'interface existante
class UserProfileService {
  // Créer un nouveau profil utilisateur
  async createUserProfile(userData: { id: string; email: string; name: string; birth_date?: Date; location?: string; sports_preferences?: SportPreference[] }): Promise<User> {
    return await profileApiService.createUserProfile(userData)
  }

  // Récupérer un profil utilisateur (userId n'est plus nécessaire car on utilise le token)
  async getUserProfile(_userId?: string): Promise<User | null> {
    return await profileApiService.getUserProfile()
  }

  // Mettre à jour un profil utilisateur (userId n'est plus nécessaire)
  async updateUserProfile(_userId: string, updates: { name?: string; birth_date?: Date; location?: string; sports_preferences?: SportPreference[]; profile_picture_url?: string; notifications_enabled?: boolean }): Promise<void> {
    await profileApiService.updateUserProfile(updates)
  }

  // Mettre à jour la photo de profil (userId n'est plus nécessaire)
  async updateProfilePicture(_userId: string, pictureUrl: string): Promise<void> {
    await profileApiService.updateProfilePicture(pictureUrl)
  }

  // Mettre à jour les préférences sportives (userId n'est plus nécessaire)
  async updateSportsPreferences(_userId: string, sportsPreferences: SportPreference[]): Promise<void> {
    await profileApiService.updateSportsPreferences(sportsPreferences)
  }

  // Obtenir les statistiques d'un utilisateur
  async getUserStats(userOrUserId: User | string): Promise<UserStats | null> {
    if (typeof userOrUserId === 'string') {
      // Si on passe un userId, récupérer d'abord le profil
      const user = await this.getUserProfile(userOrUserId)
      if (!user) return null
      return await profileApiService.getUserStats(user)
    }
    return await profileApiService.getUserStats(userOrUserId)
  }

  // Vérifier si un profil existe (userId n'est plus nécessaire)
  async profileExists(_userId?: string): Promise<boolean> {
    return await profileApiService.profileExists()
  }

  // Méthodes statiques conservées pour compatibilité
  static createSportPreference(sport: SportType, level: SportLevel): SportPreference {
    return profileApiService.createSportPreference(sport, level)
  }

  static getAllSportTypes(): SportType[] {
    return profileApiService.getAllSportTypes() as SportType[]
  }

  static getAllSportLevels(): SportLevel[] {
    return profileApiService.getAllSportLevels() as SportLevel[]
  }

  static getSportDisplayName(sport: SportType): string {
    return profileApiService.getSportDisplayName(sport)
  }

  static getLevelDisplayName(level: SportLevel): string {
    return profileApiService.getLevelDisplayName(level)
  }

  // Fonctions non implémentées côté API pour l'instant (nécessitent une extension future)
  async incrementEventsCreated(_userId: string): Promise<void> {
    throw new Error('Fonction non implémentée - sera ajoutée dans une version future')
  }

  async incrementEventsJoined(_userId: string): Promise<void> {
    throw new Error('Fonction non implémentée - sera ajoutée dans une version future')
  }

  async incrementMessagesSent(_userId: string): Promise<void> {
    throw new Error('Fonction non implémentée - sera ajoutée dans une version future')
  }

  async searchUsers(_searchTerm: string, _limit: number = 10): Promise<User[]> {
    throw new Error('Fonction non implémentée - sera ajoutée dans une version future')
  }

  async getUsersBySport(_sport: SportType, _limit: number = 20): Promise<User[]> {
    throw new Error('Fonction non implémentée - sera ajoutée dans une version future')
  }

  async deleteUserProfile(_userId: string): Promise<void> {
    throw new Error('Fonction non implémentée - sera ajoutée dans une version future')
  }
}

export const userProfileService = new UserProfileService()