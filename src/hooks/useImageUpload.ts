import { useState, useCallback, useRef } from 'react'
import { auth } from '@/lib/firebase'
import { ImageUtils, ImageValidationRules } from '@/lib/utils/image.utils'
import toast from 'react-hot-toast'

export interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
  uploadedUrl: string | null
  previewUrl: string | null
}

export interface UseImageUploadOptions {
  uploadType?: 'profile-picture' | 'event-image' | 'general'
  validationRules?: ImageValidationRules
  onUploadSuccess?: (url: string) => void
  onUploadError?: (error: string) => void
}

interface UploadResponse {
  success: boolean
  data?: {
    url: string
    fileName: string
    size: number
    uploadType: string
  }
  error?: string
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    uploadType = 'general',
    validationRules,
    onUploadSuccess,
    onUploadError
  } = options

  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedUrl: null,
    previewUrl: null
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Obtenir les règles de validation selon le type d'upload
  const getValidationRules = useCallback((): ImageValidationRules => {
    if (validationRules) return validationRules

    switch (uploadType) {
      case 'profile-picture':
        return ImageUtils.VALIDATION_RULES.PROFILE_PICTURE
      case 'event-image':
        return ImageUtils.VALIDATION_RULES.EVENT_IMAGE
      default:
        return ImageUtils.VALIDATION_RULES.GENERAL
    }
  }, [uploadType, validationRules])

  // Valider un fichier
  const validateFile = useCallback(async (file: File) => {
    const rules = getValidationRules()
    return await ImageUtils.validateImageFile(file, rules)
  }, [getValidationRules])

  // Créer une prévisualisation
  const createPreview = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file)
    setState(prev => ({ ...prev, previewUrl }))
    
    // Nettoyer l'ancienne URL si elle existe
    return () => URL.revokeObjectURL(previewUrl)
  }, [])

  // Upload d'un fichier
  const uploadFile = useCallback(async (file: File) => {
    // Reset de l'état
    setState({
      isUploading: true,
      progress: 0,
      error: null,
      uploadedUrl: null,
      previewUrl: null
    })

    try {
      // Validation du fichier
      const validation = await validateFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error || 'Fichier invalide')
      }

      // Création de la prévisualisation
      createPreview(file)

      // Vérification de l'authentification
      const user = auth.currentUser
      if (!user) {
        throw new Error('Vous devez être connecté pour uploader des images')
      }

      // Obtention du token d'authentification
      const token = await user.getIdToken()

      // Création du FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('uploadType', uploadType)

      // Mise à jour du progrès
      setState(prev => ({ ...prev, progress: 25 }))

      // Envoi de la requête
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      setState(prev => ({ ...prev, progress: 75 }))

      const result: UploadResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de l\'upload')
      }

      // Success
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedUrl: result.data!.url,
        error: null
      }))

      // Callbacks
      onUploadSuccess?.(result.data!.url)
      toast.success('Image uploadée avec succès!')

      return result.data!.url

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage
      }))

      onUploadError?.(errorMessage)
      toast.error(errorMessage)
      
      throw error
    }
  }, [uploadType, validateFile, createPreview, onUploadSuccess, onUploadError])

  // Gérer la sélection de fichier via input
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }, [uploadFile])

  // Gérer le drag & drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      uploadFile(file)
    }
  }, [uploadFile])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault()
  }, [])

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault()
  }, [])

  // Ouvrir le sélecteur de fichier
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Reset de l'état
  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedUrl: null,
      previewUrl: null
    })

    // Reset de l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Nettoyer la prévisualisation
  const clearPreview = useCallback(() => {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl)
    }
    setState(prev => ({ ...prev, previewUrl: null }))
  }, [state.previewUrl])

  // Obtenir les informations sur les limites d'upload
  const getUploadLimits = useCallback(() => {
    const rules = getValidationRules()
    return {
      maxSize: ImageUtils.formatFileSize(rules.maxSizeBytes),
      allowedTypes: rules.allowedTypes.join(', '),
      dimensions: {
        min: rules.minWidth && rules.minHeight ? `${rules.minWidth}x${rules.minHeight}` : null,
        max: rules.maxWidth && rules.maxHeight ? `${rules.maxWidth}x${rules.maxHeight}` : null
      }
    }
  }, [getValidationRules])

  return {
    // État
    ...state,
    
    // Actions
    uploadFile,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragEnter,
    openFileSelector,
    reset,
    clearPreview,
    
    // Utilitaires
    getUploadLimits,
    validateFile,
    
    // Refs
    fileInputRef
  }
}