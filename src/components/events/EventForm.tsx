'use client'

import React, { useState, useEffect } from 'react'
import { EventFormData, SportType, EventVisibility, safeValidateEvent, SportUtils } from '@/lib/validations/event.schema'
import { EventService } from '@/lib/services/event.service'
import { ImageUploader } from '@/components/ui/ImageUploader'

import styles from './EventForm.module.css'
import toast from 'react-hot-toast'

interface EventFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<EventFormData>
  initialImageUrl?: string
  eventId?: string
  onSuccess?: (eventId: string) => void
  onCancel?: () => void
}

export function EventForm({ 
  mode, 
  initialData = {}, 
  initialImageUrl = '', 
  eventId, 
  onSuccess, 
  onCancel 
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    name: initialData.name || '',
    type: (initialData.type as SportType) || 'foot',
    description: initialData.description || '',
    level_needed: initialData.level_needed,
    location_name: initialData.location_name || '',
    latitude: initialData.latitude,
    longitude: initialData.longitude,
    date: initialData.date || '',
    time: initialData.time || '',
    max_participants: initialData.max_participants,
    visibility: (initialData.visibility as EventVisibility) || 'public',
    competent_trainer: initialData.competent_trainer || false,
    average_speed: initialData.average_speed,
    distance: initialData.distance
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eventPictureUrl, setEventPictureUrl] = useState<string>(initialImageUrl)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Mettre à jour les données du formulaire si initialData change
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: initialData.name || '',
        type: (initialData.type as SportType) || 'foot',
        description: initialData.description || '',
        level_needed: initialData.level_needed,
        location_name: initialData.location_name || '',
        latitude: initialData.latitude,
        longitude: initialData.longitude,
        date: initialData.date || '',
        time: initialData.time || '',
        max_participants: initialData.max_participants,
        visibility: (initialData.visibility as EventVisibility) || 'public',
        competent_trainer: initialData.competent_trainer || false,
        average_speed: initialData.average_speed,
        distance: initialData.distance
      })
    }
  }, [initialData])

  useEffect(() => {
    setEventPictureUrl(initialImageUrl)
  }, [initialImageUrl])

  // Gestion de l'upload d'image
  const handleImageUploadSuccess = (url: string) => {
    setEventPictureUrl(url)
    toast.success('Photo ajoutée avec succès!')
  }

  // Gestion de la géolocalisation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur')
      return
    }

    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setFormData(prev => ({
          ...prev,
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6))
        }))
        toast.success('Position obtenue avec succès!')
        setIsGettingLocation(false)
      },
      (error) => {
        console.error('Erreur géolocalisation:', error)
        toast.error('Impossible d\'obtenir votre position')
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
              : type === 'number' ? (value ? Number(value) : undefined)
              : value
    }))

    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const validation = safeValidateEvent.form(formData)
    
    if (!validation.success) {
      const newErrors: Record<string, string> = {}
      validation.error.issues.forEach((error: any) => {
        const field = error.path[0] as string
        newErrors[field] = error.message
      })
      setErrors(newErrors)
      return false
    }
    
    setErrors({})
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire')
      return
    }

    setIsSubmitting(true)

    try {
      let result
      
      if (mode === 'create') {
        result = await EventService.createEvent(formData, eventPictureUrl)
      } else if (mode === 'edit' && eventId) {
        result = await EventService.updateEvent(eventId, formData, eventPictureUrl)
      } else {
        throw new Error('Mode ou ID d\'événement manquant pour la modification')
      }
      
      if (result.success) {
        const successMessage = mode === 'create' ? 'Événement créé avec succès!' : 'Événement modifié avec succès!'
        toast.success(successMessage)
        onSuccess?.(eventId || '')
      } else {
        toast.error(result.error || 'Erreur lors de l\'opération')
      }
    } catch (error) {
      console.error('Erreur lors de l\'opération:', error)
      const errorMessage = mode === 'create' ? 'Erreur lors de la création de l\'événement' : 'Erreur lors de la modification de l\'événement'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitButtonText = isSubmitting 
    ? (mode === 'create' ? 'Création...' : 'Modification...')
    : (mode === 'create' ? 'Créer l\'événement' : 'Modifier l\'événement')

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {mode === 'create' ? 'Créer un événement' : 'Modifier l\'événement'}
        </h1>
        <p className={styles.subtitle}>
          {mode === 'create' 
            ? 'Organisez votre prochaine session sportive et rassemblez votre communauté'
            : 'Modifiez les informations de votre événement'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Informations générales */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Informations générales</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Nom de l'événement *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="Ex: Match de foot amical"
              disabled={isSubmitting}
              required
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="type" className={styles.label}>
                Sport *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={`${styles.select} ${errors.type ? styles.inputError : ''}`}
                disabled={isSubmitting}
                required
              >
                <option value="foot">⚽ Football</option>
                <option value="course">🏃 Course à pied</option>
                <option value="tennis">🎾 Tennis</option>
                <option value="basket">🏀 Basketball</option>
                <option value="natation">🏊 Natation</option>
              </select>
              {errors.type && <span className={styles.errorText}>{errors.type}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="level_needed" className={styles.label}>
                Niveau requis
              </label>
              <select
                id="level_needed"
                name="level_needed"
                value={formData.level_needed || ''}
                onChange={handleInputChange}
                className={styles.select}
                disabled={isSubmitting}
              >
                <option value="">Tous niveaux</option>
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="confirme">Confirmé</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              placeholder="Décrivez votre événement, les règles, le matériel nécessaire..."
              rows={4}
              disabled={isSubmitting}
              required
            />
            {errors.description && <span className={styles.errorText}>{errors.description}</span>}
          </div>
        </div>

        {/* Photo de l'événement */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Photo de l'événement</h3>
            <ImageUploader
              onUploadSuccess={handleImageUploadSuccess}
            />
        </div>

        {/* Lieu et horaires */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Lieu et horaires</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="location_name" className={styles.label}>
              Lieu *
            </label>
            <input
              type="text"
              id="location_name"
              name="location_name"
              value={formData.location_name}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.location_name ? styles.inputError : ''}`}
              placeholder="Ex: Stade Municipal, Paris 15ème"
              disabled={isSubmitting}
              required
            />
            {errors.location_name && <span className={styles.errorText}>{errors.location_name}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="latitude" className={styles.label}>
                Latitude
              </label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                value={formData.latitude || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.000001"
                placeholder="Ex: 48.856614"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="longitude" className={styles.label}>
                Longitude
              </label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                value={formData.longitude || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.000001"
                placeholder="Ex: 2.352222"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className={styles.locationButton}
                disabled={isSubmitting || isGettingLocation}
              >
                {isGettingLocation ? '📍 Localisation...' : '📍 Ma position'}
              </button>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="date" className={styles.label}>
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.date ? styles.inputError : ''}`}
                disabled={isSubmitting}
                required
              />
              {errors.date && <span className={styles.errorText}>{errors.date}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="time" className={styles.label}>
                Heure *
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.time ? styles.inputError : ''}`}
                disabled={isSubmitting}
                required
              />
              {errors.time && <span className={styles.errorText}>{errors.time}</span>}
            </div>
          </div>
        </div>

        {/* Options avancées */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Options avancées</h3>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="max_participants" className={styles.label}>
                Nombre max de participants
              </label>
              <input
                type="number"
                id="max_participants"
                name="max_participants"
                value={formData.max_participants || ''}
                onChange={handleInputChange}
                className={styles.input}
                min="2"
                max="100"
                placeholder="Ex: 10"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="visibility" className={styles.label}>
                Visibilité
              </label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleInputChange}
                className={styles.select}
                disabled={isSubmitting}
              >
                <option value="public">Public</option>
                <option value="private">Privé</option>
              </select>
            </div>
          </div>

          {/* Options spécifiques selon le sport */}
          {(formData.type === 'course') && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="distance" className={styles.label}>
                  Distance (km)
                </label>
                <input
                  type="number"
                  id="distance"
                  name="distance"
                  value={formData.distance || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  min="0"
                  step="0.1"
                  placeholder="Ex: 5.0"
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="average_speed" className={styles.label}>
                  Vitesse moyenne (km/h)
                </label>
                <input
                  type="number"
                  id="average_speed"
                  name="average_speed"
                  value={formData.average_speed || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  min="0"
                  step="0.1"
                  placeholder="Ex: 10.0"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="competent_trainer"
                checked={formData.competent_trainer}
                onChange={handleInputChange}
                className={styles.checkbox}
                disabled={isSubmitting}
              />
              <span className={styles.checkboxText}>
                Je suis un entraîneur compétent pour ce sport
              </span>
            </label>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className={styles.actions}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {submitButtonText}
          </button>
        </div>
      </form>
    </div>
  )
}
