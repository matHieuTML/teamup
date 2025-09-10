import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'

export interface UploadResult {
  url: string
  fileName: string
  size: number
}

export interface UploadOptions {
  folder?: string
  maxSizeBytes?: number
  allowedTypes?: string[]
  quality?: number
}

class ImageUploadService {
  private readonly DEFAULT_MAX_SIZE = 5 * 1024 * 1024 // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  private readonly DEFAULT_QUALITY = 0.8

  async uploadImage(
    file: File, 
    userId: string, 
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      folder = 'images',
      maxSizeBytes = this.DEFAULT_MAX_SIZE,
      allowedTypes = this.ALLOWED_TYPES,
      quality = this.DEFAULT_QUALITY
    } = options

    // Validation du fichier
    this.validateFile(file, maxSizeBytes, allowedTypes)

    // Compression de l'image si nécessaire
    const processedFile = await this.compressImage(file, quality)

    // Génération du nom de fichier unique
    const fileName = this.generateFileName(file.name, userId)
    const filePath = `${folder}/${userId}/${fileName}`

    // Upload vers Firebase Storage
    const storageRef = ref(storage, filePath)
    
    try {
      const snapshot = await uploadBytes(storageRef, processedFile)
      const downloadURL = await getDownloadURL(snapshot.ref)

      return {
        url: downloadURL,
        fileName,
        size: processedFile.size
      }
    } catch (error) {
      throw new Error(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  async deleteImage(filePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, filePath)
      await deleteObject(storageRef)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      throw new Error('Impossible de supprimer l\'image')
    }
  }

  private validateFile(file: File, maxSize: number, allowedTypes: string[]): void {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`)
    }

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024)
      throw new Error(`Fichier trop volumineux. Taille maximum: ${maxSizeMB}MB`)
    }
  }

  private async compressImage(file: File, quality: number): Promise<File> {
    return new Promise((resolve, reject) => {
      // Vérifier que nous sommes côté client
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        // Côté serveur, retourner le fichier original sans compression
        resolve(file)
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calcul des dimensions optimales (max 1920x1080 pour économiser l'espace)
        const maxWidth = 1920
        const maxHeight = 1080
        
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        // Dessiner et compresser l'image
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erreur lors de la compression'))
              return
            }
            
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            
            resolve(compressedFile)
          },
          file.type,
          quality
        )
      }

      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'))
      
      // Lecture du fichier
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string
        }
      }
      reader.readAsDataURL(file)
    })
  }

  private generateFileName(originalName: string, userId: string): string {
    const timestamp = Date.now()
    const uuid = uuidv4().slice(0, 8)
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
    
    return `${timestamp}_${uuid}.${extension}`
  }

  // Méthode utilitaire pour créer une preview
  createPreviewURL(file: File): string {
    return URL.createObjectURL(file)
  }

  // Nettoyage de la preview
  revokePreviewURL(url: string): void {
    URL.revokeObjectURL(url)
  }

  // Upload spécialisé pour photo de profil (format carré)
  async uploadProfilePicture(file: File, userId: string): Promise<UploadResult> {
    const processedFile = await this.cropToSquare(file)
    
    return this.uploadImage(processedFile, userId, {
      folder: 'profile-pictures',
      maxSizeBytes: 2 * 1024 * 1024, // 2MB pour les profils
      quality: 0.9 // Qualité plus élevée pour les profils
    })
  }

  private async cropToSquare(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      // Vérifier que nous sommes côté client
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        // Côté serveur, retourner le fichier original sans crop
        resolve(file)
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const size = Math.min(img.width, img.height)
        const startX = (img.width - size) / 2
        const startY = (img.height - size) / 2

        canvas.width = 400 // Taille fixe pour les profils
        canvas.height = 400

        ctx?.drawImage(img, startX, startY, size, size, 0, 0, 400, 400)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erreur lors du crop'))
              return
            }
            
            const croppedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            
            resolve(croppedFile)
          },
          file.type,
          0.9
        )
      }

      img.onerror = () => reject(new Error('Erreur lors du chargement pour le crop'))
      
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string
        }
      }
      reader.readAsDataURL(file)
    })
  }
}

export const imageUploadService = new ImageUploadService()