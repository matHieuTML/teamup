'use client'

import React, { useState } from 'react'
import { SportType } from '@/types/database'
import { SportUtils } from '@/lib/validations/event.schema'
import styles from './EventsSearch.module.css'

export interface EventFilters {
  search: string
  sport: SportType | 'all'
  level: string | 'all'
  dateRange: 'all' | 'today' | 'week' | 'month'
  maxDistance: number | null
  nearMe: boolean
  userLocation?: { latitude: number; longitude: number }
}

interface EventsSearchProps {
  filters: EventFilters
  onFiltersChange: (filters: EventFilters) => void
  isLoading?: boolean
}

export function EventsSearch({ filters, onFiltersChange, isLoading = false }: EventsSearchProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const handleSportChange = (sport: SportType | 'all') => {
    onFiltersChange({ ...filters, sport })
  }

  const handleLevelChange = (level: string | 'all') => {
    onFiltersChange({ ...filters, level })
  }

  const handleDateRangeChange = (dateRange: EventFilters['dateRange']) => {
    onFiltersChange({ ...filters, dateRange })
  }

  const handleMaxDistanceChange = (distance: number | null) => {
    onFiltersChange({ ...filters, maxDistance: distance })
  }

  const handleNearMeToggle = () => {
    if (!filters.nearMe && !filters.userLocation) {
      // Demander la géolocalisation
      getCurrentLocation()
    } else {
      onFiltersChange({ ...filters, nearMe: !filters.nearMe })
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n&apos;est pas supportée par votre navigateur')
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
          maxDistance: filters.maxDistance || 10 // 10km par défaut
        })
        setIsGettingLocation(false)
      },
      (error) => {
        console.error('Erreur géolocalisation:', error)
        alert('Impossible d\'obtenir votre position')
        setIsGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      sport: 'all',
      level: 'all',
      dateRange: 'all',
      maxDistance: null,
      nearMe: false,
      userLocation: undefined
    })
  }

  const hasActiveFilters = filters.search || 
    filters.sport !== 'all' || 
    filters.level !== 'all' || 
    filters.dateRange !== 'all' || 
    filters.nearMe

  return (
    <div className={styles.searchContainer}>
      {/* Barre de recherche principale */}
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher un événement, lieu, sport..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={styles.input}
            disabled={isLoading}
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange('')}
              className={styles.clearButton}
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filtres compacts */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersRow}>
          {/* Filtre sport */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Sport</label>
            <select
              value={filters.sport}
              onChange={(e) => handleSportChange(e.target.value as SportType | 'all')}
              className={styles.select}
              disabled={isLoading}
            >
              <option value="all">Tous</option>
              {Object.values(SportType).map((sport) => (
                <option key={sport} value={sport}>
                  {SportUtils.getDisplayName(sport)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre niveau */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Niveau</label>
            <select
              value={filters.level}
              onChange={(e) => handleLevelChange(e.target.value as string | 'all')}
              className={styles.select}
              disabled={isLoading}
            >
              <option value="all">Tous</option>
              <option value="débutant">Débutant</option>
              <option value="intermédiaire">Inter.</option>
              <option value="avancé">Avancé</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          {/* Filtre date */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Période</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value as EventFilters['dateRange'])}
              className={styles.select}
              disabled={isLoading}
            >
              <option value="all">Toutes</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
            </select>
          </div>

          {/* Géolocalisation */}
          <div className={styles.filterGroup}>
            <button
              onClick={handleNearMeToggle}
              className={`${styles.locationButton} ${filters.nearMe ? styles.active : ''}`}
              disabled={isLoading || isGettingLocation}
              type="button"
            >
              <span className={styles.locationIcon}>
                {isGettingLocation ? '⏳' : '📍'}
              </span>
              {isGettingLocation ? 'Localisation...' : 'Près de moi'}
            </button>
          </div>

          {filters.nearMe && (
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Distance</label>
              <select
                value={filters.maxDistance || ''}
                onChange={(e) => handleMaxDistanceChange(e.target.value ? Number(e.target.value) : null)}
                className={styles.select}
                disabled={isLoading}
              >
                <option value="">Toutes</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
                <option value="50">50 km</option>
              </select>
            </div>
          )}

          {/* Bouton reset */}
          {hasActiveFilters && (
            <div className={styles.filterGroup}>
              <button
                onClick={clearFilters}
                className={styles.clearFiltersButton}
                disabled={isLoading}
                type="button"
              >
                Effacer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Indicateurs de filtres actifs */}
      {hasActiveFilters && (
        <div className={styles.activeFilters}>
          <span className={styles.activeFiltersLabel}>Filtres actifs:</span>
          <div className={styles.activeFiltersList}>
            {filters.search && (
              <span className={styles.activeFilter}>
                Recherche: &quot;{filters.search}&quot;
                <button onClick={() => handleSearchChange('')}>✕</button>
              </span>
            )}
            {filters.sport !== 'all' && (
              <span className={styles.activeFilter}>
                {SportUtils.getIcon(filters.sport)} {SportUtils.getDisplayName(filters.sport)}
                <button onClick={() => handleSportChange('all')}>✕</button>
              </span>
            )}
            {filters.level !== 'all' && (
              <span className={styles.activeFilter}>
                Niveau: {filters.level}
                <button onClick={() => handleLevelChange('all')}>✕</button>
              </span>
            )}
            {filters.dateRange !== 'all' && (
              <span className={styles.activeFilter}>
                {filters.dateRange === 'today' && 'Aujourd&apos;hui'}
                {filters.dateRange === 'week' && 'Cette semaine'}
                {filters.dateRange === 'month' && 'Ce mois'}
                <button onClick={() => handleDateRangeChange('all')}>✕</button>
              </span>
            )}
            {filters.nearMe && (
              <span className={styles.activeFilter}>
                📍 Près de moi {filters.maxDistance && `(${filters.maxDistance}km)`}
                <button onClick={() => onFiltersChange({ ...filters, nearMe: false })}>✕</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
