'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MessageService, Message } from '@/lib/services/message.service'
import styles from './EventChat.module.css'

interface EventChatProps {
  eventId: string
  isOrganizer: boolean
  isParticipant: boolean
}

export function EventChat({ eventId, isOrganizer, isParticipant }: EventChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Écouter les messages en temps réel
  const subscribeToMessages = useCallback(() => {
    if (!eventId) return

    try {
      setError(null)
      setLoading(true)
      
      // S'abonner aux messages en temps réel
      const unsubscribe = MessageService.subscribeToEventMessages(
        eventId,
        (newMessages) => {
          setMessages(newMessages)
          setLoading(false)
        },
        (error) => {
          console.error('Erreur temps réel:', error)
          setError('Problème de connexion temps réel')
          setLoading(false)
        }
      )
      
      unsubscribeRef.current = unsubscribe
    } catch (err) {
      console.error('Erreur lors de l\'abonnement aux messages:', err)
      setError('Impossible de charger les messages')
      setLoading(false)
    }
  }, [eventId])

  // Nettoyer l'abonnement
  const unsubscribeFromMessages = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
  }, [])

  // Scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Envoyer un message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || sending || !user) return

    try {
      setSending(true)
      setError(null)

      await MessageService.sendMessageDirect({
        id_event: eventId,
        content: newMessage.trim()
      })

      setNewMessage('')
    
      // Déclencher le scroll automatique après l'envoi
      setShouldAutoScroll(true)
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }  
    } catch (err) {
      console.error('Erreur lors de l\'envoi:', err)
      setError('Impossible d\'envoyer le message')
    } finally {
      setSending(false)
    }
  }

  // Modifier un message
  const handleEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return

    try {
      await MessageService.updateMessage(messageId, editingContent.trim())
      setEditingMessageId(null)
      setEditingContent('')
    } catch (err) {
      console.error('Erreur lors de la modification:', err)
      setError('Impossible de modifier le message')
    }
  }

  // Supprimer un message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return

    try {
      await MessageService.deleteMessage(messageId)
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      setError('Impossible de supprimer le message')
    }
  }

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    
    // Auto-resize
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  // Gérer les raccourcis clavier
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as any)
    }
  }

  // Effets
  useEffect(() => {
    subscribeToMessages()
    
    return () => {
      unsubscribeFromMessages()
    }
  }, [subscribeToMessages, unsubscribeFromMessages])

  useEffect(() => {
    // Ne faire le scroll automatique que si c'est demandé (après envoi d'un message)
    if (shouldAutoScroll) {
      scrollToBottom()
      setShouldAutoScroll(false)
    }
  }, [messages, shouldAutoScroll])

  // Vérifier si l'utilisateur peut modifier/supprimer un message
  const canModifyMessage = (message: Message) => {
    return user && (message.id_user === user.uid || isOrganizer)
  }

  if (loading) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h2>💬 Messages</h2>
          {isOrganizer && (
            <div className={styles.organizerBadge}>
              <span>👑</span>
              <span>Organisateur</span>
            </div>
          )}
        </div>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Chargement des messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2>💬 Messages</h2>
        {isOrganizer && (
          <div className={styles.organizerBadge}>
            <span>👑</span>
            <span>Organisateur</span>
          </div>
        )}
        {isParticipant && !isOrganizer && (
          <div className={styles.participantBadge}>
            <span>✅</span>
            <span>Participant</span>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className={styles.dismissError}>×</button>
        </div>
      )}

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>💬</div>
            <h3>Aucun message pour le moment</h3>
            <p>
              {isOrganizer 
                ? "Lancez la conversation avec vos participants !"
                : "Soyez le premier à envoyer un message !"
              }
            </p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`${styles.messageItem} ${
                  message.id_user === user?.uid ? styles.ownMessage : styles.otherMessage
                } ${message.from_organizer ? styles.organizerMessage : ''}`}
              >
                <div className={styles.messageHeader}>
                  <div className={styles.messageAuthor}>
                    {message.user?.profile_picture_url ? (
                      <img 
                        src={message.user.profile_picture_url} 
                        alt={message.user.name}
                        className={styles.authorAvatar}
                      />
                    ) : (
                      <div className={styles.authorAvatarDefault}>
                        {message.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span className={styles.authorName}>
                      {message.user?.name || 'Utilisateur'}
                    </span>
                  </div>
                  <div className={styles.messageActions}>
                    <span className={styles.messageTime}>
                      {message.from_organizer && '👑 '}
                      {MessageService.formatMessageTime(message.time)}
                    </span>
                    {canModifyMessage(message) && (
                      <div className={styles.messageMenu}>
                        <button 
                          onClick={() => {
                            setEditingMessageId(message.id)
                            setEditingContent(message.content)
                          }}
                          className={styles.editButton}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteMessage(message.id)}
                          className={styles.deleteButton}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={styles.messageContent}>
                  {editingMessageId === message.id ? (
                    <div className={styles.editForm}>
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className={styles.editTextarea}
                        autoFocus
                      />
                      <div className={styles.editActions}>
                        <button 
                          onClick={() => handleEditMessage(message.id)}
                          className={styles.saveButton}
                        >
                          Sauvegarder
                        </button>
                        <button 
                          onClick={() => {
                            setEditingMessageId(null)
                            setEditingContent('')
                          }}
                          className={styles.cancelButton}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.messageText}>{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <div className={styles.inputContainer}>
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={isOrganizer ? "Message aux participants" : "Votre message"}
            className={styles.messageInput}
            disabled={sending}
            rows={1}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className={styles.sendButton}
          >
            {sending ? (
              <div className={styles.loadingSpinner}></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
