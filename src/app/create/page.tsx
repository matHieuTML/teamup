'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import { CreateEventForm } from '@/components/events/CreateEventForm'
import styles from './page.module.css'

export default function CreatePage() {
  const { loading, isAuthenticated } = useAuthRedirect(true)
  const router = useRouter()

  const handleEventCreated = (eventId: string) => {
    // Rediriger vers la page de l'événement créé ou la liste des événements
    router.push(`/events/${eventId}`)
  }

  const handleCancel = () => {
    router.push('/events')
  }

  if (loading) {
    return (
      <MainLayout>
        <div className={styles.loadingContainer}>
          <p className={styles.loadingText}>
            Chargement...
          </p>
        </div>
      </MainLayout>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <CreateEventForm 
          onSuccess={handleEventCreated}
          onCancel={handleCancel}
        />
      </div>
    </MainLayout>
  )
}