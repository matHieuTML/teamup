'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { MainLayout } from '@/components/layout'
import { EventCard } from '@/components/events/EventCard'
import { EventFilters } from '@/components/events/EventsSearch'
import { FilterOverlay } from '@/components/events/FilterOverlay'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import { Event } from '@/types/database'
import { EventService } from '@/lib/services/event.service'
import toast from 'react-hot-toast'
import styles from './page.module.css'

export default function EventsPage() {
  const { user, loading: authLoading } = useAuthRedirect(false) // Ne pas rediriger si pas connecté
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterOverlayOpen, setIsFilterOverlayOpen] = useState(false)

  // État des filtres
  const [filters, setFilters] = useState<EventFilters>({
    search: '',
    sport: 'all',
    level: 'all',
    dateRange: 'all',
    maxDistance: null,
    nearMe: false,
    userLocation: undefined
  })

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      const eventsData = await EventService.getEvents()
      setEvents(eventsData.events || [])
    } catch (error) {
      console.error('Erreur chargement événements:', error)
      toast.error('Erreur lors du chargement des événements')
    } finally {
      setIsLoading(false)
    }
  }

  // Charger les événements même sans utilisateur connecté
  useEffect(() => {
    if (!authLoading) {
      loadEvents()
    }
  }, [authLoading])

  // Calcul de distance (formule haversine simplifiée)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Filtrage des événements
  const filteredEvents = useMemo(() => {
    console.log('🚀 DÉBUT FILTRAGE - État initial:')
    console.log('- Événements totaux:', events.length)
    console.log('- Filtres actifs:', filters)
    
    let filtered = [...events]

    // FILTRE PRINCIPAL: Exclure les événements passés (utilise EventService pour cohérence)
    const now = new Date()
    filtered = filtered.filter(event => {
      const eventDate = EventService.convertFirestoreDate(event.date)
      return eventDate >= now
    })
    console.log('- Après filtre passés:', filtered.length)

    // Filtre par recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.location_name.toLowerCase().includes(searchLower)
      )
      console.log('- Après filtre recherche:', filtered.length)
    }

    // Filtre par sport
    if (filters.sport !== 'all') {
      filtered = filtered.filter(event => event.type === filters.sport)
      console.log('- Après filtre sport:', filtered.length)
    }

    // Filtre par niveau - DEBUG
    if (filters.level !== 'all') {
      console.log('🔍 FILTRAGE NIVEAU - DEBUG:')
      console.log('- Filtre sélectionné:', `"${filters.level}"`)
      console.log('- Événements avant filtrage:', filtered.length)
      
      filtered.forEach((event, index) => {
        console.log(`Event ${index}: "${event.name}" - level_needed: "${event.level_needed}"`)
      })
      
      filtered = filtered.filter(event => {
        // Gérer les événements sans level_needed (undefined/null)
        if (!event.level_needed) {
          console.log(`❌ Exclu "${event.name}": pas de level_needed`)
          return false
        }
        
        const match = event.level_needed === filters.level
        console.log(`${match ? '✅' : '❌'} "${event.name}": "${event.level_needed}" === "${filters.level}" ? ${match}`)
        return match
      })
      
      console.log('- Événements après filtrage:', filtered.length)
    }

    // Filtre par date (maintenant que les événements passés sont exclus)
    if (filters.dateRange !== 'all') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(event => {
        const eventDate = EventService.convertFirestoreDate(event.date)
        
        switch (filters.dateRange) {
          case 'today':
            return eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
          case 'week':
            const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            return eventDate >= today && eventDate < weekEnd
          case 'month':
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
            return eventDate >= today && eventDate < monthEnd
          default:
            return true
        }
      })
    }

    // Filtre par géolocalisation
    if (filters.nearMe && filters.userLocation && filters.maxDistance) {
      filtered = filtered.filter(event => {
        const distance = calculateDistance(
          filters.userLocation!.latitude,
          filters.userLocation!.longitude,
          event.latitude,
          event.longitude
        )
        return distance <= filters.maxDistance!
      })
    }

    // Trier par date (plus proches en premier)
    filtered.sort((a, b) => {
      const dateA = EventService.convertFirestoreDate(a.date)
      const dateB = EventService.convertFirestoreDate(b.date)
      return dateA.getTime() - dateB.getTime()
    })

    return filtered
  }, [events, filters])


  if (authLoading) {
    return (
      <MainLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Chargement...</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className={styles.eventsPage}>


        {/* Barre de recherche */}
        <div className={styles.searchOnly}>
          <div className={styles.searchInput}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher un événement, lieu, sport..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className={styles.input}
              disabled={isLoading}
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ ...filters, search: '' })}
                className={styles.clearButton}
                type="button"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Bouton de filtres intégré */}
          <button
            onClick={() => setIsFilterOverlayOpen(true)}
            className={styles.filterButton}
            type="button"
          >
            <span className={styles.filterIcon}>⚙️</span>
            <span className={styles.filterText}>Filtres</span>
            {(filters.sport !== 'all' || filters.level !== 'all' || filters.dateRange !== 'all' || filters.nearMe) && (
              <span className={styles.filterBadge}>
                {[
                  filters.sport !== 'all',
                  filters.level !== 'all', 
                  filters.dateRange !== 'all',
                  filters.nearMe
                ].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Résultats */}
        <div className={styles.resultsSection}>
          {isLoading ? (
            <div className={styles.loadingGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}></div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <>
              <div className={styles.resultsHeader}>
                <p className={styles.resultsCount}>
                  {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} trouvé{filteredEvents.length > 1 ? 's' : ''}
                </p>
              </div>
              
              <div className={styles.eventsGrid}>
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className={styles.simpleEmptyState}>
              <p className={styles.simpleEmptyText}>
                Aucun événement ne correspond aux critères.
              </p>
            </div>
          )}
        </div>

        {/* Overlay de filtres */}
        <FilterOverlay
          isOpen={isFilterOverlayOpen}
          onClose={() => setIsFilterOverlayOpen(false)}
          filters={filters}
          onFiltersChange={setFilters}
          eventCount={filteredEvents.length}
        />
      </div>
    </MainLayout>
  )
}