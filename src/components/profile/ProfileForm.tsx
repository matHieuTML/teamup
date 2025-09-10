'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, SportPreference } from '@/types/database'
import { userProfileService } from '@/lib/services/user-profile.service'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { SportsSelector } from './SportsSelector'
import styles from './ProfileForm.module.css'

const profileSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  location: z.string().min(2, 'La localisation doit contenir au moins 2 caractères').max(100, 'La localisation ne peut pas dépasser 100 caractères').optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  notifications_enabled: z.boolean()
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user?: User | null
  onSave?: (updatedUser: User) => void
  className?: string
}

export function ProfileForm({ user, onSave, className }: ProfileFormProps) {
  const { user: authUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [sportsPreferences, setSportsPreferences] = useState<SportPreference[]>([])
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | undefined>()

  // Fonction utilitaire pour normaliser la date
  const normalizeBirthDate = (birthDate: Date | string | { toDate: () => Date } | null | undefined): string => {
    if (!birthDate) return ''
    
    try {
      // Si c'est déjà une string au format YYYY-MM-DD
      if (typeof birthDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        return birthDate
      }
      
      // Si c'est un Timestamp Firestore
      if (birthDate && typeof birthDate === 'object' && 'toDate' in birthDate && typeof birthDate.toDate === 'function') {
        return birthDate.toDate().toISOString().split('T')[0]
      }
      
      // Si c'est un objet Date
      if (birthDate instanceof Date) {
        return birthDate.toISOString().split('T')[0]
      }
      
      // Si c'est une string ISO ou autre format, essayer de la parser
      if (typeof birthDate === 'string') {
        const date = new Date(birthDate)
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]
        }
      }
      
      return ''
    } catch (error) {
      console.warn('Erreur lors de la normalisation de birth_date:', error)
      return ''
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      location: user?.location || '',
      birth_date: normalizeBirthDate(user?.birth_date),
      notifications_enabled: user?.notifications_enabled ?? true
    }
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        location: user.location || '',
        birth_date: normalizeBirthDate(user.birth_date),
        notifications_enabled: user.notifications_enabled
      })
      setSportsPreferences(user.sports_preferences)
      setProfilePictureUrl(user.profile_picture_url)
    }
  }, [user, reset])

  const onSubmit = async (data: ProfileFormData) => {
    if (!authUser || !user) {
      toast.error('Vous devez être connecté')
      return
    }

    setIsLoading(true)

    try {
      const updateData = {
        name: data.name,
        location: data.location || undefined,
        birth_date: data.birth_date ? new Date(data.birth_date) : undefined,
        notifications_enabled: data.notifications_enabled,
        sports_preferences: sportsPreferences,
        profile_picture_url: profilePictureUrl
      }

      await userProfileService.updateUserProfile(authUser.uid, updateData)

      // Construire l'utilisateur mis à jour
      const updatedUser: User = {
        ...user,
        ...updateData
      }

      onSave?.(updatedUser)
      toast.success('Profil mis à jour avec succès!')

      // Reset du form pour marquer comme non-modifié
      reset(data)
    } catch (error) {
      console.error('Erreur mise à jour profil:', error)
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSportsChange = (sports: SportPreference[]) => {
    setSportsPreferences(sports)
  }

  const handleProfilePictureChange = (url: string) => {
    setProfilePictureUrl(url)
  }

  const hasChanges = isDirty || 
    JSON.stringify(sportsPreferences) !== JSON.stringify(user?.sports_preferences || []) ||
    profilePictureUrl !== user?.profile_picture_url

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${styles.form} ${className || ''}`}>
      {/* Photo de profil */}
      <div className={styles.section}>
        <ProfilePictureUpload
          currentPictureUrl={profilePictureUrl}
          onUploadSuccess={handleProfilePictureChange}
        />
      </div>

      {/* Informations personnelles */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Informations personnelles</h3>
        </div>

        <div className={styles.fieldsGrid}>
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Nom complet *
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="Votre nom et prénom"
            />
            {errors.name && (
              <span className={styles.errorMessage}>{errors.name.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="location" className={styles.label}>
              Localisation
            </label>
            <input
              id="location"
              type="text"
              {...register('location')}
              className={`${styles.input} ${errors.location ? styles.inputError : ''}`}
              placeholder="Ville, région..."
            />
            {errors.location && (
              <span className={styles.errorMessage}>{errors.location.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="birth_date" className={styles.label}>
              Date de naissance
            </label>
            <input
              id="birth_date"
              type="date"
              {...register('birth_date')}
              className={`${styles.input} ${errors.birth_date ? styles.inputError : ''}`}
            />
            {errors.birth_date && (
              <span className={styles.errorMessage}>{errors.birth_date.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <div className={styles.checkboxField}>
              <input
                id="notifications_enabled"
                type="checkbox"
                {...register('notifications_enabled')}
                className={styles.checkbox}
              />
              <label htmlFor="notifications_enabled" className={styles.checkboxLabel}>
                Recevoir les notifications
                <span className={styles.checkboxDescription}>
                  Rappels d&apos;événements, nouveaux messages, etc.
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Sports préférés */}
      <div className={styles.section}>
        <SportsSelector
          currentSports={sportsPreferences}
          onChange={handleSportsChange}
        />
      </div>

      {/* Statistiques */}
      {user && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Mes statistiques</h3>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user.number_event_created}</span>
              <span className={styles.statLabel}>Événements créés</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user.number_event_joined}</span>
              <span className={styles.statLabel}>Événements rejoints</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{user.number_message_sent}</span>
              <span className={styles.statLabel}>Messages envoyés</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
              </span>
              <span className={styles.statLabel}>Membre depuis</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          type="submit"
          disabled={!hasChanges || isLoading}
          className={`${styles.saveButton} ${!hasChanges ? styles.saveButtonDisabled : ''}`}
        >
          {isLoading ? (
            <>
              <span className={styles.spinner}></span>
              Sauvegarde...
            </>
          ) : (
            'Sauvegarder les modifications'
          )}
        </button>
        
        {hasChanges && (
          <p className={styles.changeIndicator}>
            Vous avez des modifications non sauvegardées
          </p>
        )}
      </div>
    </form>
  )
}