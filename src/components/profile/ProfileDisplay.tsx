'use client'

import React, { useState } from 'react'
import { User, SportPreference } from '@/types'
import { SportsUtils } from '@/lib/utils/sports.utils'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { ProfileEditModal } from './ProfileEditModal'
import { AddSportModal } from './AddSportModal'
import styles from './ProfileDisplay.module.css'

interface ProfileDisplayProps {
  user: User
  onProfileUpdate: (updates: Partial<User>) => Promise<void>
  className?: string
}

export function ProfileDisplay({ user, onProfileUpdate, className }: ProfileDisplayProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isAddingSport, setIsAddingSport] = useState(false)
  const [isEditingPicture, setIsEditingPicture] = useState(false)

  // Fonction utilitaire pour formater les dates (utilisée dans les modales)
  // Note: formatBirthDate est utilisé dans ProfileEditModal via props

  const calculateAge = (birthDate: Date | string | null | undefined): number | null => {
    if (!birthDate) return null
    
    try {
      const dateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
      const today = new Date()
      const age = today.getFullYear() - dateObj.getFullYear()
      const monthDiff = today.getMonth() - dateObj.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
        return age - 1
      }
      return age
    } catch {
      return null
    }
  }

  const handleAddSport = async (sport: SportPreference) => {
    const updatedSports = [...(user.sports_preferences || []), sport]
    await onProfileUpdate({ sports_preferences: updatedSports })
    setIsAddingSport(false)
  }

  const handleRemoveSport = async (index: number) => {
    const updatedSports = user.sports_preferences?.filter((_, i) => i !== index) || []
    await onProfileUpdate({ sports_preferences: updatedSports })
  }

  const age = calculateAge(user.birth_date)

  // Génération des pins dynamiques
  const generatePins = () => {
    const pins = []
    const creationDate = new Date(user.created_at)
    const now = new Date()
    const daysSinceCreation = Math.floor((now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
    const sportsCount = user.sports_preferences?.length || 0

    // Pin nouveau membre (moins d'un mois)
    if (daysSinceCreation < 30) {
      pins.push({ key: 'new', emoji: '🌱', text: 'Nouveau', color: 'var(--color-green)' })
    }

    // Pin membre expérimenté (plus de 6 mois)
    if (daysSinceCreation > 180) {
      pins.push({ key: 'veteran', emoji: '🌟', text: 'Vétéran', color: 'var(--color-orange)' })
    }

    // Pin membre fidèle (plus d'un an)
    if (daysSinceCreation > 365) {
      pins.push({ key: 'loyal', emoji: '💎', text: 'Fidèle', color: 'var(--color-mint)' })
    }

    // Pin sportif polyvalent (3+ sports)
    if (sportsCount >= 3) {
      pins.push({ key: 'polyvalent', emoji: '🏆', text: 'Polyvalent', color: 'var(--color-orange)' })
    }



    // Pin expert sportif (5+ sports)
    if (sportsCount >= 5) {
      pins.push({ key: 'expert', emoji: '🥇', text: 'Expert', color: 'var(--color-orange)' })
    }

    // Pin profil complet
    if (user.name && user.location && user.birth_date && user.profile_picture_url) {
      pins.push({ key: 'complete', emoji: '✨', text: 'Profil Complet', color: 'var(--color-mint)' })
    }







    // Pin selon le niveau moyen
    const sportsPrefs = user.sports_preferences || []
    if (sportsPrefs.length > 0) {
      const hasExpert = sportsPrefs.some(s => s.level === 'expert')
      const hasConfirme = sportsPrefs.some(s => s.level === 'confirme')
      const hasDebutant = sportsPrefs.some(s => s.level === 'debutant')

      if (hasExpert) {
        pins.push({ key: 'pro', emoji: '🏅', text: 'Pro', color: 'var(--color-orange)' })
      } else if (hasConfirme) {
        pins.push({ key: 'skilled', emoji: '🎯', text: 'Confirmé', color: 'var(--color-mint)' })
      } else if (hasDebutant) {
        pins.push({ key: 'beginner', emoji: '🌟', text: 'Débutant', color: 'var(--color-green)' })
      }
    }

    // Pin jour de la semaine d'inscription (fun)
    const creationDay = creationDate.getDay()
    if (creationDay === 1) { // Lundi
      pins.push({ key: 'monday', emoji: '💼', text: 'Lundi Motivé', color: 'var(--color-green)' })
    } else if (creationDay === 5) { // Vendredi
      pins.push({ key: 'friday', emoji: '🎉', text: 'Vendredi Fun', color: 'var(--color-orange)' })
    } else if (creationDay === 0 || creationDay === 6) { // Weekend
      pins.push({ key: 'weekend', emoji: '🏖️', text: 'Weekend Warrior', color: 'var(--color-mint)' })
    }

    // Pin heure d'inscription (fun)
    const creationHour = creationDate.getHours()
    if (creationHour >= 6 && creationHour < 12) {
      pins.push({ key: 'morning', emoji: '🌅', text: 'Lève-tôt', color: 'var(--color-green)' })
    } else if (creationHour >= 22 || creationHour < 6) {
      pins.push({ key: 'night', emoji: '🌙', text: 'Noctambule', color: 'var(--color-mint)' })
    }

    return pins.slice(0, 8) // Limiter à 8 pins pour éviter la surcharge
  }

  // Les pins sont générés dynamiquement dans le JSX

  return (
    <div className={`${styles.profileContainer} ${className || ''}`}>
      {/* Hero Section - Photo et infos principales */}
      <div className={styles.heroSection}>
        <div className={styles.profileImageContainer}>
          <div 
            className={styles.profileImage}
            style={{
              backgroundImage: user.profile_picture_url 
                ? `url(${user.profile_picture_url})` 
                : 'none'
            }}
          >
            {!user.profile_picture_url && (
              <div className={styles.placeholderIcon}>👤</div>
            )}
          </div>
          <button 
            onClick={() => setIsEditingPicture(true)}
            className={styles.editImageButton}
            title="Modifier la photo"
          >
            ✏️
          </button>
        </div>
        
        <div className={styles.profileInfo}>
          <div className={styles.nameSection}>
            <h1 className={styles.userName}>{user.name || 'Utilisateur'}</h1>
            <button 
              onClick={() => setIsEditingProfile(true)}
              className={styles.editButton}
              title="Modifier le profil"
            >
              ✏️
            </button>
          </div>
          
          <div className={styles.quickInfo}>
            {user.location && (
              <span className={styles.location}>📍 {user.location}</span>
            )}
            {age && (
              <span className={styles.age}>🎂 {age} ans</span>
            )}
            <span className={styles.memberSince}>
              ⭐ Membre depuis {new Date(user.created_at).getFullYear()}
            </span>
          </div>
        </div>
      </div>

      {/* Pins Section */}
      <div className={styles.pinsSection}>
        {generatePins().map(pin => (
          <div 
            key={pin.key} 
            className={styles.pin}
            style={{ backgroundColor: pin.color }}
          >
            <span className={styles.pinEmoji}>{pin.emoji}</span>
            <span className={styles.pinText}>{pin.text}</span>
          </div>
        ))}
      </div>

      {/* Stats Section */}
      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>Statistiques</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{user.number_event_created || 0}</div>
            <div className={styles.statLabel}>Événements créés</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{user.number_event_joined || 0}</div>
            <div className={styles.statLabel}>Participations</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{user.number_message_sent || 0}</div>
            <div className={styles.statLabel}>Messages</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{user.sports_preferences?.length || 0}</div>
            <div className={styles.statLabel}>Sports</div>
          </div>
        </div>
      </div>

      {/* Sports Section */}
      <div className={styles.sportsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Sports pratiqués</h2>
          <button 
            onClick={() => setIsAddingSport(true)}
            className={styles.addSportButton}
            title="Ajouter un sport"
          >
            +
          </button>
        </div>
        
        {user.sports_preferences && user.sports_preferences.length > 0 ? (
          <div className={styles.sportsGrid}>
            {user.sports_preferences.map((sport, index) => (
              <div key={index} className={styles.sportCard}>
                <div className={styles.sportContent}>
                  <span className={styles.sportIcon}>
                    {SportsUtils.getSportIcon(sport.sport)}
                  </span>
                  <div className={styles.sportDetails}>
                    <span className={styles.sportName}>
                      {SportsUtils.getSportDisplayName(sport.sport)}
                    </span>
                    <span 
                      className={styles.sportLevel}
                      style={{ color: SportsUtils.getLevelColor(sport.level) }}
                    >
                      {SportsUtils.getLevelDisplayName(sport.level)}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveSport(index)}
                  className={styles.removeSportButton}
                  title="Supprimer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptySports}>
            <div className={styles.emptyIcon}>🏃‍♂️</div>
            <p className={styles.emptyText}>Aucun sport ajouté</p>
            <p className={styles.emptySubtext}>Ajoutez vos sports préférés</p>
          </div>
        )}
      </div>

      {/* Modales */}
      {isEditingPicture && (
        <div className={styles.modalOverlay} onClick={() => setIsEditingPicture(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <button 
                onClick={() => setIsEditingPicture(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <ProfilePictureUpload 
              currentPictureUrl={user.profile_picture_url}
              onUploadSuccess={(url) => {
                onProfileUpdate({ profile_picture_url: url })
                setIsEditingPicture(false)
              }}
            />
          </div>
        </div>
      )}

      {isEditingProfile && (
        <ProfileEditModal
          user={user}
          onSave={async (updates) => {
            await onProfileUpdate(updates)
            setIsEditingProfile(false)
          }}
          onClose={() => setIsEditingProfile(false)}
        />
      )}

      {isAddingSport && (
        <AddSportModal
          existingSports={user.sports_preferences || []}
          onAdd={handleAddSport}
          onClose={() => setIsAddingSport(false)}
        />
      )}
    </div>
  )
}
