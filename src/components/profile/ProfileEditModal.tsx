'use client'

import React, { useState } from 'react'
import { User } from '@/types'
import styles from './ProfileEditModal.module.css'

interface ProfileEditModalProps {
  user: User
  onSave: (updates: Partial<User>) => Promise<void>
  onClose: () => void
}

export function ProfileEditModal({ user, onSave, onClose }: ProfileEditModalProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    location: user.location || '',
    birth_date: user.birth_date ? 
      (typeof user.birth_date === 'string' ? user.birth_date.split('T')[0] : 
       user.birth_date instanceof Date ? user.birth_date.toISOString().split('T')[0] : '') : '',
    notifications_enabled: user.notifications_enabled ?? true
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères'
    }
    
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date)
      const today = new Date()
      if (birthDate > today) {
        newErrors.birth_date = 'La date de naissance ne peut pas être dans le futur'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      const updates: Partial<User> = {
        name: formData.name.trim(),
        location: formData.location.trim() || undefined,
        birth_date: formData.birth_date ? new Date(formData.birth_date) : undefined,
        notifications_enabled: formData.notifications_enabled
      }
      
      await onSave(updates)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Modifier mes informations</h3>
          <button 
            onClick={onClose}
            className={styles.closeButton}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Nom *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              disabled={isLoading}
              placeholder="Votre nom complet"
            />
            {errors.name && (
              <span className={styles.errorMessage}>{errors.name}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="location" className={styles.label}>
              Localisation
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className={styles.input}
              disabled={isLoading}
              placeholder="Votre ville ou quartier"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="birth_date" className={styles.label}>
              Date de naissance
            </label>
            <input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleChange('birth_date', e.target.value)}
              className={`${styles.input} ${errors.birth_date ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.birth_date && (
              <span className={styles.errorMessage}>{errors.birth_date}</span>
            )}
          </div>

          <div className={styles.checkboxField}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.notifications_enabled}
                onChange={(e) => handleChange('notifications_enabled', e.target.checked)}
                className={styles.checkbox}
                disabled={isLoading}
              />
              <span className={styles.checkboxText}>
                Recevoir les notifications par email
              </span>
            </label>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
