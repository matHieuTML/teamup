'use client'

import React from 'react'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { userProfileService } from '@/lib/services/user-profile.service'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import styles from './ProfilePictureUpload.module.css'

interface ProfilePictureUploadProps {
  currentPictureUrl?: string
  onUploadSuccess?: (url: string) => void
  className?: string
}

export function ProfilePictureUpload({
  currentPictureUrl,
  onUploadSuccess,
  className
}: ProfilePictureUploadProps) {
  const { user } = useAuth()

  const handleUploadSuccess = async (url: string) => {
    if (!user) {
      toast.error('Vous devez être connecté')
      return
    }

    try {
      await userProfileService.updateProfilePicture(user.uid, url)
      onUploadSuccess?.(url)
      toast.success('Photo de profil mise à jour!')
    } catch (error) {
      console.error('Erreur mise à jour photo:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {currentPictureUrl ? (
        <div className={styles.currentPicture}>
          <img 
            src={currentPictureUrl} 
            alt="Photo de profil actuelle"
            className={styles.currentImage}
          />
          <div className={styles.changeButton}>
            <ImageUploader
              variant="profile"
              uploadType="profile-picture"
              onUploadSuccess={handleUploadSuccess}
              placeholder="✏️"
              className={styles.uploader}
            />
          </div>
        </div>
      ) : (
        <div className={styles.uploadZone}>
          <ImageUploader
            variant="profile"
            uploadType="profile-picture"
            onUploadSuccess={handleUploadSuccess}
            placeholder="Ajouter une photo"
            className={styles.uploader}
          />
        </div>
      )}
      
      <div className={styles.info}>
        JPG, PNG, WebP • Max 2MB • Min 150x150px
      </div>
    </div>
  )
}