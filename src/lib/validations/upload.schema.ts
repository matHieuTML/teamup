import { z } from 'zod'

export const UploadTypeSchema = z.enum(['profile-picture', 'event-image', 'general'])

export const AllowedImageTypesSchema = z.enum([
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
])

export const AllowedExtensionsSchema = z.enum([
  'jpg',
  'jpeg',
  'png',
  'webp'
])

export const FileValidationSchema = z.object({
  name: z.string().min(1, 'Nom de fichier requis'),
  size: z.number()
    .min(1, 'Le fichier ne peut pas être vide')
    .max(10 * 1024 * 1024, 'Fichier trop volumineux (max 10MB)'),
  type: AllowedImageTypesSchema,
  lastModified: z.number().optional()
})

export const UploadRequestSchema = z.object({
  uploadType: UploadTypeSchema.default('general')
})

export const UploadResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    url: z.string().url('URL invalide'),
    fileName: z.string().min(1, 'Nom de fichier requis'),
    size: z.number().positive('Taille invalide'),
    uploadType: UploadTypeSchema
  }).optional(),
  error: z.string().optional()
})

export const UploadRulesSchema = z.object({
  'profile-picture': z.object({
    maxSize: z.literal(2 * 1024 * 1024),
    allowedTypes: z.array(AllowedImageTypesSchema),
    minWidth: z.literal(150).optional(),
    minHeight: z.literal(150).optional(),
    maxWidth: z.literal(2000).optional(),
    maxHeight: z.literal(2000).optional(),
    description: z.literal('Photo de profil (format carré, max 2MB)')
  }),
  'event-image': z.object({
    maxSize: z.literal(8 * 1024 * 1024),
    allowedTypes: z.array(AllowedImageTypesSchema),
    minWidth: z.literal(400).optional(),
    minHeight: z.literal(300).optional(),
    description: z.literal('Image d\'événement (max 8MB)')
  }),
  'general': z.object({
    maxSize: z.literal(5 * 1024 * 1024),
    allowedTypes: z.array(AllowedImageTypesSchema),
    description: z.literal('Image générale (max 5MB)')
  })
})

export const FileMetadataSchema = z.object({
  originalName: z.string(),
  sanitizedName: z.string(),
  extension: AllowedExtensionsSchema,
  mimeType: AllowedImageTypesSchema,
  size: z.number().positive(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive()
  }).optional(),
  uploadedAt: z.date(),
  userId: z.string().min(1, 'ID utilisateur requis'),
  uploadType: UploadTypeSchema
})

export const UploadConfigSchema = z.object({
  maxFileSize: z.number().positive().default(5 * 1024 * 1024),
  allowedTypes: z.array(AllowedImageTypesSchema).default(['image/jpeg', 'image/png', 'image/webp']),
  maxFiles: z.number().positive().default(1),
  compressionQuality: z.number().min(0.1).max(1).default(0.8),
  resizeOptions: z.object({
    maxWidth: z.number().positive().optional(),
    maxHeight: z.number().positive().optional(),
    maintainAspectRatio: z.boolean().default(true)
  }).optional()
})

export const UploadErrorSchema = z.object({
  code: z.enum([
    'FILE_TOO_LARGE',
    'INVALID_FILE_TYPE',
    'INVALID_DIMENSIONS',
    'UPLOAD_FAILED',
    'COMPRESSION_FAILED',
    'VALIDATION_FAILED',
    'NETWORK_ERROR',
    'AUTHENTICATION_ERROR',
    'PERMISSION_DENIED'
  ]),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional()
})

export type UploadType = z.infer<typeof UploadTypeSchema>
export type AllowedImageType = z.infer<typeof AllowedImageTypesSchema>
export type AllowedExtension = z.infer<typeof AllowedExtensionsSchema>
export type FileValidation = z.infer<typeof FileValidationSchema>
export type UploadRequest = z.infer<typeof UploadRequestSchema>
export type UploadResponse = z.infer<typeof UploadResponseSchema>
export type FileMetadata = z.infer<typeof FileMetadataSchema>
export type UploadConfig = z.infer<typeof UploadConfigSchema>
export type UploadError = z.infer<typeof UploadErrorSchema>

export const UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: {
    PROFILE_PICTURE: 2 * 1024 * 1024,
    EVENT_IMAGE: 8 * 1024 * 1024,
    GENERAL: 5 * 1024 * 1024
  },
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp'] as const,
  MIN_DIMENSIONS: {
    PROFILE_PICTURE: { width: 150, height: 150 },
    EVENT_IMAGE: { width: 400, height: 300 }
  },
  MAX_DIMENSIONS: {
    PROFILE_PICTURE: { width: 2000, height: 2000 },
    GENERAL: { width: 1920, height: 1080 }
  },
  COMPRESSION: {
    PROFILE_PICTURE: 0.9,
    EVENT_IMAGE: 0.85,
    GENERAL: 0.8
  }
} as const

export const validateUpload = {
  file: (file: File) => {
    const validation = FileValidationSchema.safeParse({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    })
    return validation
  },
  
  request: (data: unknown) => UploadRequestSchema.safeParse(data),
  response: (data: unknown) => UploadResponseSchema.safeParse(data),
  metadata: (data: unknown) => FileMetadataSchema.safeParse(data),
  config: (data: unknown) => UploadConfigSchema.safeParse(data)
}

export const getUploadRules = (uploadType: UploadType) => {
  switch (uploadType) {
    case 'profile-picture':
      return {
        maxSize: UPLOAD_CONSTANTS.MAX_FILE_SIZE.PROFILE_PICTURE,
        allowedTypes: UPLOAD_CONSTANTS.ALLOWED_TYPES,
        minWidth: UPLOAD_CONSTANTS.MIN_DIMENSIONS.PROFILE_PICTURE.width,
        minHeight: UPLOAD_CONSTANTS.MIN_DIMENSIONS.PROFILE_PICTURE.height,
        maxWidth: UPLOAD_CONSTANTS.MAX_DIMENSIONS.PROFILE_PICTURE.width,
        maxHeight: UPLOAD_CONSTANTS.MAX_DIMENSIONS.PROFILE_PICTURE.height,
        compressionQuality: UPLOAD_CONSTANTS.COMPRESSION.PROFILE_PICTURE
      }
    
    case 'event-image':
      return {
        maxSize: UPLOAD_CONSTANTS.MAX_FILE_SIZE.EVENT_IMAGE,
        allowedTypes: UPLOAD_CONSTANTS.ALLOWED_TYPES,
        minWidth: UPLOAD_CONSTANTS.MIN_DIMENSIONS.EVENT_IMAGE.width,
        minHeight: UPLOAD_CONSTANTS.MIN_DIMENSIONS.EVENT_IMAGE.height,
        compressionQuality: UPLOAD_CONSTANTS.COMPRESSION.EVENT_IMAGE
      }
    
    default:
      return {
        maxSize: UPLOAD_CONSTANTS.MAX_FILE_SIZE.GENERAL,
        allowedTypes: UPLOAD_CONSTANTS.ALLOWED_TYPES,
        maxWidth: UPLOAD_CONSTANTS.MAX_DIMENSIONS.GENERAL.width,
        maxHeight: UPLOAD_CONSTANTS.MAX_DIMENSIONS.GENERAL.height,
        compressionQuality: UPLOAD_CONSTANTS.COMPRESSION.GENERAL
      }
  }
}

export const UploadErrorMessages = {
  FILE_TOO_LARGE: (maxSize: number) => 
    `Fichier trop volumineux. Taille maximum: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`,
  INVALID_FILE_TYPE: (allowedTypes: readonly string[]) => 
    `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`,
  INVALID_DIMENSIONS: (minWidth?: number, minHeight?: number, maxWidth?: number, maxHeight?: number) => {
    const constraints = []
    if (minWidth && minHeight) constraints.push(`minimum ${minWidth}x${minHeight}px`)
    if (maxWidth && maxHeight) constraints.push(`maximum ${maxWidth}x${maxHeight}px`)
    return `Dimensions invalides. ${constraints.join(', ')}`
  },
  UPLOAD_FAILED: 'Échec de l\'upload. Veuillez réessayer.',
  COMPRESSION_FAILED: 'Erreur lors de la compression de l\'image.',
  VALIDATION_FAILED: 'Les données fournies ne sont pas valides.',
  NETWORK_ERROR: 'Erreur de connexion. Vérifiez votre internet.',
  AUTHENTICATION_ERROR: 'Authentification requise.',
  PERMISSION_DENIED: 'Permission insuffisante pour cette action.'
} as const