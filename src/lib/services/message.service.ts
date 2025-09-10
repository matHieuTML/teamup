import { getAuth } from 'firebase/auth'

export interface Message {
  id: string
  id_event: string
  id_user: string
  time: Date | { seconds: number } | string
  content: string
  from_organizer: boolean
  user?: {
    name: string
    profile_picture_url?: string
  }
}

export interface SendMessageData {
  id_event: string
  content: string
}

export class MessageService {
  private static baseUrl = '/api/messages'

  // Utilitaire pour récupérer le token d'authentification
  private static async getAuthToken(): Promise<string> {
    const auth = getAuth()
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié')
    }

    return await auth.currentUser.getIdToken()
  }

  // Récupérer les messages d'un événement
  static async getEventMessages(eventId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      const token = await this.getAuthToken()
      
      const params = new URLSearchParams({
        eventId,
        limit: limit.toString(),
        offset: offset.toString()
      })

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const data = await response.json()
      return data.messages || []
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error)
      throw error
    }
  }

  // Envoyer un nouveau message
  static async sendMessage(messageData: SendMessageData): Promise<{ success: boolean; messageId?: string }> {
    try {
      const auth = getAuth()
      
      if (!auth.currentUser) {
        throw new Error('Utilisateur non authentifié')
      }

      const token = await this.getAuthToken()

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_event: messageData.id_event,
          id_user: auth.currentUser.uid,
          content: messageData.content.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const data = await response.json()
      return { success: true, messageId: data.messageId }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      throw error
    }
  }

  // Modifier un message
  static async updateMessage(messageId: string, content: string): Promise<{ success: boolean }> {
    try {
      const auth = getAuth()
      
      if (!auth.currentUser) {
        throw new Error('Utilisateur non authentifié')
      }

      const token = await this.getAuthToken()

      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: messageId,
          content: content.trim(),
          id_user: auth.currentUser.uid
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la modification du message:', error)
      throw error
    }
  }

  // Supprimer un message
  static async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    try {
      const auth = getAuth()
      
      if (!auth.currentUser) {
        throw new Error('Utilisateur non authentifié')
      }

      const token = await this.getAuthToken()

      const params = new URLSearchParams({
        id: messageId,
        userId: auth.currentUser.uid
      })

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error)
      throw error
    }
  }

  // Formater la date d'un message
  static formatMessageTime(date: Date | { seconds: number } | string): string {
    try {
      let jsDate: Date

      if (date instanceof Date) {
        jsDate = date
      } else if (date && typeof date === 'object' && (date.seconds || (date as any)._seconds)) {
        const seconds = date.seconds || (date as any)._seconds
        jsDate = new Date(seconds * 1000)
      } else if (typeof date === 'string') {
        jsDate = new Date(date)
      } else {
        return 'Maintenant'
      }

      const now = new Date()
      const diffMs = now.getTime() - jsDate.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMinutes < 1) {
        return 'Maintenant'
      } else if (diffMinutes < 60) {
        return `Il y a ${diffMinutes}min`
      } else if (diffHours < 24) {
        return `Il y a ${diffHours}h`
      } else if (diffDays < 7) {
        return `Il y a ${diffDays}j`
      } else {
        return jsDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short'
        })
      }
    } catch (error) {
      console.error('Erreur formatage date message:', error)
      return 'Date invalide'
    }
  }
}
