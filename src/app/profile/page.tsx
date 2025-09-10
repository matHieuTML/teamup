'use client'

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout'
import { ProfileDisplay } from '@/components/profile/ProfileDisplay'
import { NotificationTestButton } from '@/components/notifications/NotificationTestButton'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import { useAuth } from '@/contexts/AuthContext'
import { userProfileService } from '@/lib/services/user-profile.service'
import { User } from '@/types/database'
import toast from 'react-hot-toast'
import styles from './page.module.css'

export default function ProfilePage() {
  const { loading: authLoading, isAuthenticated } = useAuthRedirect(true)
  const { user: authUser } = useAuth()
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger le profil utilisateur
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!authUser || !isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const profile = await userProfileService.getUserProfile(authUser.uid)
        
        if (!profile) {
          // Créer un profil si il n'existe pas
          const newProfile = await userProfileService.createUserProfile({
            id: authUser.uid,
            email: authUser.email,
            name: authUser.displayName || authUser.email.split('@')[0]
          })
          setUserProfile(newProfile)
          toast.success('Profil créé avec succès!')
        } else {
          setUserProfile(profile)
        }
      } catch (err) {
        console.error('Erreur chargement profil:', err)
        setError('Impossible de charger le profil')
        toast.error('Erreur lors du chargement du profil')
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [authUser, isAuthenticated])

  const handleProfileSave = (updatedUser: User) => {
    setUserProfile(updatedUser)
  }

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>
              Chargement de votre profil...
            </p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (error) {
    return (
      <MainLayout>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Erreur</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className={styles.retryButton}
            >
              Réessayer
            </button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className={styles.container}>


        <div className={styles.content}>
          {userProfile && (
            <>
              <ProfileDisplay 
                user={userProfile}
                onProfileUpdate={async (updates: Partial<User>) => {
                  try {
                    await userProfileService.updateUserProfile(authUser!.uid, updates)
                    // Recharger le profil après mise à jour
                    const updatedProfile = await userProfileService.getUserProfile(authUser!.uid)
                    if (updatedProfile) {
                      setUserProfile(updatedProfile)
                    }
                  } catch (error) {
                    console.error('Erreur lors de la mise à jour du profil:', error)
                    throw error
                  }
                }}
              />
              
              {/* Bouton de test des notifications push */}
              <NotificationTestButton user={userProfile} />
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}