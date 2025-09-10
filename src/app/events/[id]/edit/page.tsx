'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import { EventForm } from '@/components/events/EventForm'
import { EventService } from '@/lib/services/event.service'
import { EventFormData } from '@/lib/validations/event.schema'
import styles from './page.module.css'
import toast from 'react-hot-toast'

export default function EditEventPage() {
  const { loading: authLoading, isAuthenticated } = useAuthRedirect(true)
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [eventData, setEventData] = useState<EventFormData | null>(null)
  const [eventImageUrl, setEventImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId || !isAuthenticated) return

      try {
        setLoading(true)
        const event = await EventService.getEventById(eventId)
        
        if (!event) {
          setError('Événement non trouvé')
          return
        }

        // Convertir les données de l'événement au format du formulaire
        let eventDate: Date
        let dateString = ''
        let timeString = ''

        try {
          // Debug: afficher le format de la date reçue
          console.log('🔍 Debug - Format de date reçu:', {
            date: event.date,
            type: typeof event.date,
            isObject: typeof event.date === 'object',
            hasSeconds: event.date && typeof event.date === 'object' && 'seconds' in event.date,
            keys: event.date && typeof event.date === 'object' ? Object.keys(event.date) : null
          })

          // Fonction robuste de conversion de date
          const convertToDate = (dateValue: any): Date => {
            if (!dateValue) {
              throw new Error('Date manquante')
            }

            // Format Firestore Timestamp avec seconds et nanoseconds
            if (typeof dateValue === 'object' && 'seconds' in dateValue) {
              console.log('📅 Conversion Firestore Timestamp:', dateValue.seconds)
              return new Date(dateValue.seconds * 1000)
            }

            // Format Firestore Timestamp avec _seconds
            if (typeof dateValue === 'object' && '_seconds' in dateValue) {
              console.log('📅 Conversion Firestore _seconds:', dateValue._seconds)
              return new Date(dateValue._seconds * 1000)
            }

            // Format Date JavaScript sérialisé
            if (typeof dateValue === 'object' && dateValue.constructor?.name === 'Date') {
              console.log('📅 Conversion Date object:', dateValue)
              return new Date(dateValue)
            }

            // Format string ISO ou autre
            if (typeof dateValue === 'string') {
              console.log('📅 Conversion string:', dateValue)
              const parsed = new Date(dateValue)
              if (!isNaN(parsed.getTime())) {
                return parsed
              }
              // Essayer de parser différents formats
              const isoMatch = dateValue.match(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
              if (isoMatch) {
                return new Date(`${isoMatch[1]}T${isoMatch[2]}:00`)
              }
            }

            // Format timestamp en millisecondes
            if (typeof dateValue === 'number') {
              console.log('📅 Conversion number timestamp:', dateValue)
              // Si c'est en secondes (timestamp < 2000000000), convertir en millisecondes
              const timestamp = dateValue < 2000000000 ? dateValue * 1000 : dateValue
              return new Date(timestamp)
            }

            console.log('❌ Format de date non reconnu:', dateValue)
            throw new Error(`Format de date non supporté: ${typeof dateValue}`)
          }

          eventDate = convertToDate(event.date)
          console.log('📅 Date convertie:', eventDate, 'Valid:', !isNaN(eventDate.getTime()))

          // Vérifier que la date est valide
          if (isNaN(eventDate.getTime())) {
            throw new Error('Date invalide après conversion')
          }

          dateString = eventDate.toISOString().split('T')[0] // Format YYYY-MM-DD
          timeString = eventDate.toTimeString().slice(0, 5) // Format HH:MM
        } catch (dateError) {
          console.error('Erreur de conversion de date:', dateError, 'Date originale:', event.date)
          // Utiliser une date par défaut (aujourd'hui)
          const now = new Date()
          dateString = now.toISOString().split('T')[0]
          timeString = '18:00' // Heure par défaut
          toast.error('Erreur lors du chargement de la date de l\'événement, date par défaut utilisée')
        }

        const formData: EventFormData = {
          name: event.name,
          type: event.type as any,
          description: event.description,
          level_needed: event.level_needed as any,
          location_name: event.location_name,
          latitude: event.latitude,
          longitude: event.longitude,
          date: dateString,
          time: timeString,
          max_participants: event.max_participants,
          visibility: event.visibility as any,
          competent_trainer: event.competent_trainer || false,
          average_speed: event.average_speed,
          distance: event.distance
        }

        setEventData(formData)
        setEventImageUrl(event.picture_url || '')
      } catch (err) {
        console.error('Erreur lors du chargement de l\'événement:', err)
        setError('Impossible de charger l\'événement')
        toast.error('Erreur lors du chargement de l\'événement')
      } finally {
        setLoading(false)
      }
    }

    loadEventData()
  }, [eventId, isAuthenticated])

  const handleEventUpdated = (updatedEventId: string) => {
    // Rediriger vers la page de l'événement modifié
    router.push(`/events/${updatedEventId}`)
  }

  const handleCancel = () => {
    router.push(`/events/${eventId}`)
  }

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className={styles.loadingContainer}>
          <p className={styles.loadingText}>
            Chargement de l'événement...
          </p>
        </div>
      </MainLayout>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (error || !eventData) {
    return (
      <MainLayout>
        <div className={styles.errorContainer}>
          <h1 className={styles.errorTitle}>Erreur</h1>
          <p className={styles.errorText}>
            {error || 'Impossible de charger l\'événement'}
          </p>
          <button 
            onClick={() => router.push('/places')}
            className={styles.backButton}
          >
            Retour à mes événements
          </button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <EventForm 
          mode="edit"
          initialData={eventData}
          initialImageUrl={eventImageUrl}
          eventId={eventId}
          onSuccess={handleEventUpdated}
          onCancel={handleCancel}
        />
      </div>
    </MainLayout>
  )
}
