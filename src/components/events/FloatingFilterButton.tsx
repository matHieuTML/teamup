'use client'

import React from 'react'
import styles from './FloatingFilterButton.module.css'

interface FloatingFilterButtonProps {
  onClick: () => void
  hasActiveFilters: boolean
  filterCount: number
}

export function FloatingFilterButton({ 
  onClick, 
  hasActiveFilters, 
  filterCount 
}: FloatingFilterButtonProps) {
  return (
    <button 
      className={`${styles.floatingButton} ${hasActiveFilters ? styles.active : ''}`}
      onClick={onClick}
    >
      <span className={styles.filterIcon}>⚙️</span>
      <span className={styles.buttonText}>Filtres</span>
      {hasActiveFilters && (
        <div className={styles.badge}>
          {filterCount}
        </div>
      )}
    </button>
  )
}
