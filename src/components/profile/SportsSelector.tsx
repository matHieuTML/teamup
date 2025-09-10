'use client'

import React, { useState, useEffect } from 'react'
import { SportPreference, SportType, SportLevel } from '@/types/database'
import { SportsUtils } from '@/lib/utils/sports.utils'
import styles from './SportsSelector.module.css'

interface SportsSelectorProps {
  currentSports?: SportPreference[]
  onChange?: (sports: SportPreference[]) => void
  className?: string
}

interface SportSelection extends SportPreference {
  id: string
}

export function SportsSelector({
  currentSports = [],
  onChange,
  className
}: SportsSelectorProps) {
  const [selectedSports, setSelectedSports] = useState<SportSelection[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  
  useEffect(() => {
    const sportsWithIds = currentSports.map((sport, index) => ({
      ...sport,
      id: `${sport.sport}-${index}`
    }))
    setSelectedSports(sportsWithIds)
  }, [currentSports])

  const handleAddSport = (sport: SportType, level: SportLevel) => {
    const newSport: SportSelection = {
      id: `${sport}-${Date.now()}`,
      sport,
      level
    }
    
    const updatedSports = [...selectedSports, newSport]
    setSelectedSports(updatedSports)
    onChange?.(updatedSports.map(({ id, ...sport }) => sport))
    setIsAddingNew(false)
  }

  const handleRemoveSport = (sportId: string) => {
    const updatedSports = selectedSports.filter(sport => sport.id !== sportId)
    setSelectedSports(updatedSports)
    onChange?.(updatedSports.map(({ id, ...sport }) => sport))
  }

  const handleUpdateLevel = (sportId: string, newLevel: SportLevel) => {
    const updatedSports = selectedSports.map(sport => 
      sport.id === sportId ? { ...sport, level: newLevel } : sport
    )
    setSelectedSports(updatedSports)
    onChange?.(updatedSports.map(({ id, ...sport }) => sport))
  }

  const getAvailableSports = () => {
    const selectedSportTypes = selectedSports.map(s => s.sport)
    return SportsUtils.getAllSportTypes().filter(
      sport => !selectedSportTypes.includes(sport)
    )
  }


  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Sports préférés</h3>
        <p className={styles.subtitle}>
          Sélectionnez vos sports et niveaux pour trouver des événements adaptés
        </p>
      </div>

      {/* Sports sélectionnés */}
      <div className={styles.selectedSports}>
        {selectedSports.map((sport) => (
          <div key={sport.id} className={styles.sportItem}>
            <div className={styles.sportInfo}>
              <span className={styles.sportIcon}>
                {SportsUtils.getSportIcon(sport.sport)}
              </span>
              <div className={styles.sportDetails}>
                <span className={styles.sportName}>
                  {SportsUtils.getSportDisplayName(sport.sport)}
                </span>
                <select
                  value={sport.level}
                  onChange={(e) => handleUpdateLevel(sport.id, e.target.value as SportLevel)}
                  className={styles.levelSelect}
                  style={{ borderColor: SportsUtils.getLevelColor(sport.level) }}
                >
                  {SportsUtils.getAllSportLevels().map(level => (
                    <option key={level} value={level}>
                      {SportsUtils.getLevelDisplayName(level)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveSport(sport.id)}
              className={styles.removeButton}
              aria-label={`Supprimer ${SportsUtils.getSportDisplayName(sport.sport)}`}
            >
              ✕
            </button>
          </div>
        ))}

        {selectedSports.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🏃‍♂️</span>
            <p className={styles.emptyText}>
              Aucun sport sélectionné. Ajoutez vos sports préférés!
            </p>
          </div>
        )}
      </div>

      {/* Ajouter un nouveau sport */}
      {isAddingNew ? (
        <div className={styles.addForm}>
          <div className={styles.addFormContent}>
            <select
              onChange={(e) => {
                const sport = e.target.value as SportType
                const level = SportLevel.INTERMEDIAIRE
                if (sport) {
                  handleAddSport(sport, level)
                }
              }}
              className={styles.sportSelect}
              defaultValue=""
            >
              <option value="" disabled>
                Choisir un sport...
              </option>
              {getAvailableSports().map(sport => (
                <option key={sport} value={sport}>
                  {SportsUtils.getSportIcon(sport)} {SportsUtils.getSportDisplayName(sport)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingNew(false)}
            className={styles.cancelButton}
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingNew(true)}
          disabled={getAvailableSports().length === 0}
          className={styles.addButton}
        >
          <span className={styles.addIcon}>+</span>
          Ajouter un sport
        </button>
      )}

      {/* Informations sur les niveaux */}
      <div className={styles.levelInfo}>
        <h4 className={styles.levelTitle}>Niveaux expliqués</h4>
        <div className={styles.levelGrid}>
          {SportsUtils.getAllSportLevels().map(level => (
            <div key={level} className={styles.levelItem}>
              <div 
                className={styles.levelIndicator}
                style={{ backgroundColor: SportsUtils.getLevelColor(level) }}
              />
              <span className={styles.levelName}>
                {SportsUtils.getLevelDisplayName(level)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}