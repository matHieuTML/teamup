'use client'

import React, { useState } from 'react'
import { useImageUpload, UseImageUploadOptions } from '@/hooks/useImageUpload'
import styles from './ImageUploader.module.css'

interface ImageUploaderProps extends UseImageUploadOptions {
  className?: string
  variant?: 'default' | 'compact' | 'profile'
  accept?: string
  disabled?: boolean
  placeholder?: string
}

export function ImageUploader({
  className,
  variant = 'default',
  accept = 'image/jpeg,image/png,image/webp',
  disabled = false,
  placeholder,
  ...uploadOptions
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const {
    isUploading,
    progress,
    error,
    uploadedUrl,
    previewUrl,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragEnter,
    openFileSelector,
    reset,
    getUploadLimits,
    fileInputRef
  } = useImageUpload(uploadOptions)

  const limits = getUploadLimits()

  const handleDragEnterWithState = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEnter(e)
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDropWithState = (e: React.DragEvent<HTMLDivElement>) => {
    handleDrop(e)
    setIsDragOver(false)
  }

  const getPlaceholderText = () => {
    if (placeholder) return placeholder

    switch (variant) {
      case 'profile':
        return 'Choisir une photo de profil'
      case 'compact':
        return 'Ajouter une image'
      default:
        return 'Glissez votre image ici ou cliquez pour sélectionner'
    }
  }

  const renderContent = () => {
    // Cas d'erreur
    if (error) {
      return (
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <p className={styles.errorMessage}>{error}</p>
          <button 
            type="button"
            onClick={reset} 
            className={styles.retryButton}
          >
            Réessayer
          </button>
        </div>
      )
    }

    // Cas de succès avec image uploadée
    if (uploadedUrl) {
      return (
        <div className={styles.successState}>
          <div className={styles.imagePreview}>
            <img 
              src={uploadedUrl} 
              alt="Image uploadée" 
              className={styles.uploadedImage}
            />
            {variant !== 'compact' && (
              <div className={styles.imageOverlay}>
                <button
                  type="button"
                  onClick={reset}
                  className={styles.changeButton}
                >
                  Changer
                </button>
              </div>
            )}
          </div>
          <div className={styles.successInfo}>
            <div className={styles.successIcon}>✅</div>
            <span>Image uploadée avec succès!</span>
          </div>
        </div>
      )
    }

    // Cas de prévisualisation pendant upload
    if (previewUrl) {
      return (
        <div className={styles.uploadingState}>
          <div className={styles.imagePreview}>
            <img 
              src={previewUrl} 
              alt="Prévisualisation" 
              className={styles.previewImage}
            />
            <div className={styles.uploadingOverlay}>
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className={styles.progressText}>{progress}%</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // État initial - zone de drop
    return (
      <div className={styles.dropZone}>
        {variant === 'profile' ? (
          <p className={styles.dropText}>{getPlaceholderText()}</p>
        ) : (
          <>
            <div className={styles.dropIcon}>📷</div>
            <p className={styles.dropText}>{getPlaceholderText()}</p>
            {variant !== 'compact' && (
              <div className={styles.uploadLimits}>
                <small>Max: {limits.maxSize}</small>
                <small>Formats: JPG, PNG, WebP</small>
                {limits.dimensions.min && (
                  <small>Min: {limits.dimensions.min}px</small>
                )}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div 
      className={`${styles.uploader} ${styles[variant]} ${isDragOver ? styles.dragOver : ''} ${disabled ? styles.disabled : ''} ${className || ''}`}
      onDrop={handleDropWithState}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnterWithState}
      onDragLeave={handleDragLeave}
      onClick={disabled || isUploading ? undefined : openFileSelector}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className={styles.hiddenInput}
      />
      
      {renderContent()}
    </div>
  )
}