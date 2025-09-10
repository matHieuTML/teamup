export interface ImageDimensions {
  width: number
  height: number
}

export interface ImageValidationRules {
  maxSizeBytes: number
  allowedTypes: string[]
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export class ImageUtils {
  
  // Validation d'un fichier image
  static validateImageFile(file: File, rules: ImageValidationRules): Promise<{ isValid: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Vérification du type
      if (!rules.allowedTypes.includes(file.type)) {
        resolve({
          isValid: false,
          error: `Type de fichier non autorisé. Types acceptés: ${rules.allowedTypes.join(', ')}`
        })
        return
      }

      // Vérification de la taille
      if (file.size > rules.maxSizeBytes) {
        const maxSizeMB = (rules.maxSizeBytes / (1024 * 1024)).toFixed(1)
        resolve({
          isValid: false,
          error: `Fichier trop volumineux. Taille maximum: ${maxSizeMB}MB`
        })
        return
      }

      // Vérification des dimensions si spécifiées
      if (rules.minWidth || rules.minHeight || rules.maxWidth || rules.maxHeight) {
        this.getImageDimensions(file).then((dimensions) => {
          if (rules.minWidth && dimensions.width < rules.minWidth) {
            resolve({
              isValid: false,
              error: `Largeur minimum requise: ${rules.minWidth}px`
            })
            return
          }

          if (rules.minHeight && dimensions.height < rules.minHeight) {
            resolve({
              isValid: false,
              error: `Hauteur minimum requise: ${rules.minHeight}px`
            })
            return
          }

          if (rules.maxWidth && dimensions.width > rules.maxWidth) {
            resolve({
              isValid: false,
              error: `Largeur maximum autorisée: ${rules.maxWidth}px`
            })
            return
          }

          if (rules.maxHeight && dimensions.height > rules.maxHeight) {
            resolve({
              isValid: false,
              error: `Hauteur maximum autorisée: ${rules.maxHeight}px`
            })
            return
          }

          resolve({ isValid: true })
        }).catch(() => {
          resolve({
            isValid: false,
            error: 'Erreur lors de l\'analyse de l\'image'
          })
        })
      } else {
        resolve({ isValid: true })
      }
    })
  }

  // Obtenir les dimensions d'une image
  static getImageDimensions(file: File): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Impossible de charger l\'image'))
      }

      img.src = url
    })
  }

  // Créer une prévisualisation redimensionnée
  static createThumbnail(file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calcul des nouvelles dimensions en conservant le ratio
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)
        const newWidth = Math.floor(img.width * ratio)
        const newHeight = Math.floor(img.height * ratio)

        canvas.width = newWidth
        canvas.height = newHeight

        // Dessin de l'image redimensionnée
        ctx?.drawImage(img, 0, 0, newWidth, newHeight)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erreur lors de la création de la miniature'))
              return
            }

            const thumbnailFile = new File([blob], `thumb_${file.name}`, {
              type: file.type,
              lastModified: Date.now()
            })

            resolve(thumbnailFile)
          },
          file.type,
          quality
        )
      }

      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'))

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Convertir un fichier en base64
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Erreur lors de la conversion en base64'))
        }
      }
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
      reader.readAsDataURL(file)
    })
  }

  // Formatter la taille d'un fichier en format lisible
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  // Vérifier si un fichier est une image
  static isImageFile(file: File): boolean {
    return file.type.startsWith('image/')
  }

  // Obtenir l'extension d'un fichier
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  // Créer un nom de fichier sécurisé
  static sanitizeFileName(filename: string): string {
    // Remplacer les caractères spéciaux par des tirets
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
  }

  // Extraire les couleurs dominantes d'une image (pour l'UI)
  static extractDominantColor(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        canvas.width = 1
        canvas.height = 1

        ctx?.drawImage(img, 0, 0, 1, 1)
        
        const imageData = ctx?.getImageData(0, 0, 1, 1)
        if (!imageData) {
          reject(new Error('Erreur lors de l\'extraction de couleur'))
          return
        }

        const [r, g, b] = imageData.data
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        
        resolve(hex)
      }

      img.onerror = () => reject(new Error('Erreur lors du chargement pour l\'extraction de couleur'))

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Règles de validation prédéfinies
  static readonly VALIDATION_RULES = {
    PROFILE_PICTURE: {
      maxSizeBytes: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      minWidth: 150,
      minHeight: 150,
      maxWidth: 2000,
      maxHeight: 2000
    },
    EVENT_IMAGE: {
      maxSizeBytes: 8 * 1024 * 1024, // 8MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      minWidth: 400,
      minHeight: 300
    },
    GENERAL: {
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    }
  } as const

  // Types MIME acceptés pour les images
  static readonly ACCEPTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ] as const

  // Extensions acceptées
  static readonly ACCEPTED_EXTENSIONS = [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'gif'
  ] as const
}

export default ImageUtils