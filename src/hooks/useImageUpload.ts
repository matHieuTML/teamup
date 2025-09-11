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

  const validateFile = useCallback(async (file: File) => {
    const rules = getValidationRules()
    return await ImageUtils.validateImageFile(file, rules)
  }, [getValidationRules])

  const createPreview = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file)
    setState(prev => ({ ...prev, previewUrl }))
    
    return () => URL.revokeObjectURL(previewUrl)
  }, [])

  const uploadFile = useCallback(async (file: File) => {
    setState({
      isUploading: true,
      progress: 0,
      error: null,
      uploadedUrl: null,
      previewUrl: null
    })

    try {
      const validation = await validateFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error || 'Fichier invalide')
      }

      createPreview(file)

      const user = auth.currentUser
      if (!user) {
        throw new Error('Vous devez être connecté pour uploader des images')
      }

      const token = await user.getIdToken()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('uploadType', uploadType)

      setState(prev => ({ ...prev, progress: 25 }))

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

      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedUrl: result.data!.url,
        error: null
      }))

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

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }, [uploadFile])

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

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const clearPreview = useCallback(() => {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl)
    }
    setState(prev => ({ ...prev, previewUrl: null }))
  }, [state.previewUrl])

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
    ...state,
    
    uploadFile,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragEnter,
    openFileSelector,
    reset,
    clearPreview,
    
    getUploadLimits,
    validateFile,
    
    fileInputRef
  }
}