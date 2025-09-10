'use client'

import React, { useState } from 'react'
import { SportPreference, SportType, SportLevel } from '@/types'
import { SportsUtils } from '@/lib/utils/sports.utils'
import styles from './AddSportModal.module.css'

interface AddSportModalProps {
  existingSports: SportPreference[]
  onAdd: (sport: SportPreference) => Promise<void>
  onClose: () => void
}

export function AddSportModal({ existingSports, onAdd, onClose }: AddSportModalProps) {
  const [selectedSport, setSelectedSport] = useState<SportType | ''>('')
  const [selectedLevel, setSelectedLevel] = useState<SportLevel | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const availableSports = SportsUtils.getAllSportTypes().filter(
    sport => !existingSports.some(existing => existing.sport === sport)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSport || !selectedLevel) {
      setError('Veuillez sélectionner un sport et un niveau')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      await onAdd({
        sport: selectedSport as SportType,
        level: selectedLevel as SportLevel
      })
    } catch (error) {
      console.error('Erreur lors de l\'ajout du sport:', error)
      setError('Erreur lors de l\'ajout du sport')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Ajouter un sport</h3>
          <button 
            onClick={onClose}
            className={styles.closeButton}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {availableSports.length === 0 ? (
            <div className={styles.noSports}>
              <span className={styles.emptyIcon}>🏆</span>
              <p>Vous avez déjà ajouté tous les sports disponibles !</p>
            </div>
          ) : (
            <>
              <div className={styles.field}>
                <label htmlFor="sport" className={styles.label}>
                  Sport *
                </label>
                <select
                  id="sport"
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value as SportType)}
                  className={styles.select}
                  disabled={isLoading}
                >
                  <option value="">Sélectionnez un sport</option>
                  {availableSports.map(sport => (
                    <option key={sport} value={sport}>
                      {SportsUtils.getSportIcon(sport)} {SportsUtils.getSportDisplayName(sport)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="level" className={styles.label}>
                  Niveau *
                </label>
                <select
                  id="level"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as SportLevel)}
                  className={styles.select}
                  disabled={isLoading}
                >
                  <option value="">Sélectionnez votre niveau</option>
                  {SportsUtils.getAllSportLevels().map(level => (
                    <option key={level} value={level}>
                      {SportsUtils.getLevelDisplayName(level)}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

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
                  className={styles.addButton}
                  disabled={isLoading || !selectedSport || !selectedLevel}
                >
                  {isLoading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
