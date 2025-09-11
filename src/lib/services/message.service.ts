import { getAuth } from 'firebase/auth'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, Unsubscribe } from 'firebase/firestore'

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

  private static async getAuthToken(): Promise<string> {
    const auth = getAuth()
    
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié')
    }

    return await auth.currentUser.getIdToken()
  }

  static subscribeToEventMessages(
    eventId: string, 
    callback: (messages: Message[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const messagesRef = collection(db, 'messages')
      const q = query(
        messagesRef,
        where('id_event', '==', eventId)
      )

      return onSnapshot(q, 
        async (snapshot) => {
          const enrichedMessages = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const messageData = doc.data()
              
              let userData = null
              let isOrganizer = false
              
              if (messageData.id_user) {
                try {
                  const { db } = await import('@/lib/firebase')
                  const { doc: firestoreDoc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore')
                  
                  const userDocRef = firestoreDoc(db, 'users', messageData.id_user)
                  const userDoc = await getDoc(userDocRef)
                  
                  if (userDoc.exists()) {
                    const user = userDoc.data()
                    userData = {
                      name: user?.name || user?.first_name || 'Utilisateur',
                      profile_picture_url: user?.profile_picture_url || null
                    }
                  }
                  
                  const userEventsRef = collection(db, 'userEvents')
                  const organizerQuery = query(
                    userEventsRef,
                    where('id_event', '==', eventId),
                    where('id_user', '==', messageData.id_user),
                    where('role', '==', 'organisateur')
                  )
                  
                  const organizerSnapshot = await getDocs(organizerQuery)
                  isOrganizer = !organizerSnapshot.empty
                  
                } catch (error) {
                  console.warn('Erreur lors de la récupération des données utilisateur:', error)
                }
              }

              return {
                id: doc.id,
                ...messageData,
                time: messageData.time?.toDate() || new Date(),
                user: userData || { name: 'Utilisateur', profile_picture_url: null },
                from_organizer: isOrganizer || messageData.from_organizer || false
              } as Message
            })
          )
          
          const sortedMessages = enrichedMessages.sort((a, b) => {
            const timeA = a.time instanceof Date ? a.time : new Date(a.time as string)
            const timeB = b.time instanceof Date ? b.time : new Date(b.time as string)
            return timeA.getTime() - timeB.getTime()
          })
          
          callback(sortedMessages)
        },
        (error) => {
          console.error('Erreur lors de l\'écoute des messages:', error)
          if (onError) onError(error)
        }
      )
    } catch (error) {
      console.error('Erreur lors de la souscription aux messages:', error)
      if (onError) onError(error as Error)
      return () => {}
    }
  }

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

  static async sendMessageDirect(messageData: SendMessageData): Promise<{ success: boolean; messageId?: string }> {
    try {
      const auth = getAuth()
      
      if (!auth.currentUser) {
        throw new Error('Utilisateur non authentifié')
      }

      const messagesRef = collection(db, 'messages')
      const docRef = await addDoc(messagesRef, {
        id_event: messageData.id_event,
        id_user: auth.currentUser.uid,
        content: messageData.content.trim(),
        time: serverTimestamp(),
        from_organizer: false
      })

      return { success: true, messageId: docRef.id }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message direct:', error)
      throw error
    }
  }

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

  static formatMessageTime(date: Date | { seconds: number } | string): string {
    try {
      let jsDate: Date

      if (date instanceof Date) {
        jsDate = date
      } else if (date && typeof date === 'object' && 'seconds' in date) {
        jsDate = new Date(date.seconds * 1000)
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
