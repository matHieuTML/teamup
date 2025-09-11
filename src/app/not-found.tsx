'use client'

import React from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.iconContainer}>
            <span className={styles.icon}>🏃‍♂️</span>
          </div>
          
          <h1 className={styles.title}>404</h1>
          <h2 className={styles.subtitle}>Page introuvable</h2>
          
          <p className={styles.description}>
            Oups ! Il semble que cette page ait pris la fuite comme un coureur rapide. 
            Elle n'existe pas ou a été déplacée.
          </p>
          
          <div className={styles.actions}>
            <Link href="/" className={styles.primaryButton}>
              Retour à l'accueil
            </Link>
            <Link href="/events" className={styles.secondaryButton}>
              Voir les événements
            </Link>
          </div>
          
          <div className={styles.suggestions}>
            <h3 className={styles.suggestionsTitle}>Que souhaitez-vous faire ?</h3>
            <div className={styles.suggestionsList}>
              <Link href="/events" className={styles.suggestionItem}>
                <span className={styles.suggestionIcon}>🏆</span>
                <span>Découvrir des événements sportifs</span>
              </Link>
              <Link href="/profile" className={styles.suggestionItem}>
                <span className={styles.suggestionIcon}>👤</span>
                <span>Accéder à mon profil</span>
              </Link>
              <Link href="/create" className={styles.suggestionItem}>
                <span className={styles.suggestionIcon}>➕</span>
                <span>Créer un événement</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
