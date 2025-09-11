'use client'

import React, { useState } from 'react'
import { SportType } from '@/types/database'
import { SportUtils } from '@/lib/validations/event.schema'
import { EventFilters } from './EventsSearch'
import styles from './FilterOverlay.module.css'

interface FilterOverlayProps {
  isOpen: boolean
  onClose: () => void
  filters: EventFilters
  onFiltersChange: (filters: EventFilters) => void
  eventCount: number
}

export function FilterOverlay({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  eventCount 
}: FilterOverlayProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const handleSportToggle = (sport: SportType) => {
    const currentSports = filters.sport === 'all' ? [] : [filters.sport]
    const newSports = currentSports.includes(sport) 
      ? currentSports.filter(s => s !== sport)
      : [...currentSports, sport]
    
    onFiltersChange({ 
      ...filters, 
      sport: newSports.length === 0 ? 'all' : newSports[0] // Simplifié pour l'exemple
    })
  }

  const handleLevelChange = (level: string) => {
    onFiltersChange({ ...filters, level: level as any })
  }

  const handleDateRangeChange = (dateRange: EventFilters['dateRange']) => {
    onFiltersChange({ ...filters, dateRange })
  }

  const handleNearMeToggle = () => {
    if (!filters.nearMe && !filters.userLocation) {
      getCurrentLocation()
    } else {
      onFiltersChange({ ...filters, nearMe: !filters.nearMe })
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur')
      return
    }

    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        onFiltersChange({ 
          ...filters, 
          nearMe: true, 
          userLocation,
          maxDistance: filters.maxDistance || 10
        })
        setIsGettingLocation(false)
      },
      (error) => {
        console.error('Erreur géolocalisation:', error)
        alert('Impossible d\'obtenir votre position')
        setIsGettingLocation(false)
      }
    )
  }

  const handleDistanceChange = (distance: number) => {
    onFiltersChange({ ...filters, maxDistance: distance })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      search: filters.search, // Garder la recherche
      sport: 'all',
      level: 'all',
      dateRange: 'all',
      maxDistance: null,
      nearMe: false,
      userLocation: undefined
    })
  }

  const applyFilters = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Background overlay */}
      <div className={styles.backdrop} onClick={onClose} />
      
      {/* Filter panel */}
      <div className={styles.filterPanel}>
        {/* Drag handle */}
        <div className={styles.dragHandle} />
        
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>Filtres</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          
          {/* Sports Section */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⚽</span>
              Sports
            </h4>
            <div className={styles.sportsGrid}>
              {Object.values(SportType).slice(0, 9).map((sport) => (
                <button
                  key={sport}
                  className={`${styles.sportButton} ${
                    filters.sport === sport ? styles.active : ''
                  }`}
                  onClick={() => handleSportToggle(sport)}
                >
                  <span className={styles.sportIcon}>
                    {SportUtils.getIcon(sport)}
                  </span>
                  <span className={styles.sportName}>
                    {SportUtils.getDisplayName(sport)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Level Section */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🎯</span>
              Niveau
            </h4>
            <div className={styles.levelButtons}>
              {[
                { value: 'debutant', label: 'Débutant' },
                { value: 'intermediaire', label: 'Intermédiaire' },
                { value: 'confirme', label: 'Confirmé' },
                { value: 'expert', label: 'Expert' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={`${styles.levelButton} ${
                    filters.level === value ? styles.active : ''
                  } ${styles[`level${label}`]}`}
                  onClick={() => handleLevelChange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Section */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📅</span>
              Période
            </h4>
            <div className={styles.dateButtons}>
              {[
                { key: 'today', label: 'Aujourd\'hui', icon: '📅' },
                { key: 'week', label: 'Cette semaine', icon: '📆' },
                { key: 'month', label: 'Ce mois', icon: '🗓️' }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  className={`${styles.dateButton} ${
                    filters.dateRange === key ? styles.active : ''
                  }`}
                  onClick={() => handleDateRangeChange(key as any)}
                >
                  <span className={styles.dateIcon}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Location Section */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📍</span>
              Localisation
            </h4>
            <div className={styles.locationControls}>
              <button
                className={`${styles.locationToggle} ${
                  filters.nearMe ? styles.active : ''
                }`}
                onClick={handleNearMeToggle}
                disabled={isGettingLocation}
              >
                <span className={styles.locationIcon}>
                  {isGettingLocation ? '⏳' : '📍'}
                </span>
                {isGettingLocation ? 'Localisation...' : 'Près de moi'}
              </button>
              
              {filters.nearMe && (
                <div className={styles.distanceSlider}>
                  <label className={styles.sliderLabel}>
                    Distance: {filters.maxDistance || 10} km
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={filters.maxDistance || 10}
                    onChange={(e) => handleDistanceChange(Number(e.target.value))}
                    className={styles.slider}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <div className={styles.eventCount}>
            {eventCount} événement{eventCount > 1 ? 's' : ''} trouvé{eventCount > 1 ? 's' : ''}
          </div>
          <div className={styles.actions}>
            <button 
              className={styles.clearButton} 
              onClick={clearAllFilters}
            >
              Effacer tout
            </button>
            <button 
              className={styles.applyButton} 
              onClick={applyFilters}
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
