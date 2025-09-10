import { z } from 'zod'

// Énumérations pour les événements
export const SportTypeSchema = z.enum(['foot', 'course', 'tennis', 'basket', 'natation'])

export const SportLevelSchema = z.enum(['debutant', 'intermediaire', 'confirme', 'expert'])

export const EventVisibilitySchema = z.enum(['public', 'private'])

// Schéma pour la création d'un événement
export const CreateEventSchema = z.object({
  name: z.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_.,!?]+$/, 'Le nom contient des caractères non autorisés'),
  
  type: SportTypeSchema,
  
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères'),
  
  level_needed: SportLevelSchema.optional(),
  
  location_name: z.string()
    .min(3, 'Le lieu doit contenir au moins 3 caractères')
    .max(200, 'Le lieu ne peut pas dépasser 200 caractères'),
  
  latitude: z.number()
    .min(-90, 'Latitude invalide')
    .max(90, 'Latitude invalide'),
  
  longitude: z.number()
    .min(-180, 'Longitude invalide')
    .max(180, 'Longitude invalide'),
  
  date: z.string()
    .refine((date) => {
      const eventDate = new Date(date)
      const now = new Date()
      return eventDate > now
    }, 'La date doit être dans le futur'),
  
  time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
  
  max_participants: z.number()
    .min(2, 'Minimum 2 participants')
    .max(100, 'Maximum 100 participants')
    .optional(),
  
  visibility: EventVisibilitySchema.default('public'),
  
  competent_trainer: z.boolean().default(false),
  
  average_speed: z.number()
    .min(0, 'La vitesse doit être positive')
    .max(50, 'Vitesse trop élevée')
    .optional(),
  
  distance: z.number()
    .min(0, 'La distance doit être positive')
    .max(200, 'Distance trop élevée')
    .optional(),
  
  picture_url: z.string()
    .url('URL d\'image invalide')
    .optional()
    .or(z.literal(''))
})

// Schéma pour la mise à jour d'un événement
export const UpdateEventSchema = CreateEventSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'Au moins un champ doit être fourni pour la mise à jour'
)

// Schéma pour le formulaire côté client (avec date et heure séparées)
export const EventFormSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  type: SportTypeSchema,
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  level_needed: SportLevelSchema.optional(),
  location_name: z.string().min(3, 'Le lieu doit contenir au moins 3 caractères'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  date: z.string().refine((date) => {
    if (!date) return false
    const eventDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return eventDate >= today
  }, 'La date ne peut pas être dans le passé'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide'),
  max_participants: z.number().min(2).max(100).optional(),
  visibility: EventVisibilitySchema.default('public'),
  competent_trainer: z.boolean().default(false),
  average_speed: z.number().min(0).max(50).optional(),
  distance: z.number().min(0).max(200).optional()
})

// Types TypeScript dérivés des schémas
export type CreateEventData = z.infer<typeof CreateEventSchema>
export type UpdateEventData = z.infer<typeof UpdateEventSchema>
export type EventFormData = z.infer<typeof EventFormSchema>
export type SportType = z.infer<typeof SportTypeSchema>
export type SportLevel = z.infer<typeof SportLevelSchema>
export type EventVisibility = z.infer<typeof EventVisibilitySchema>

// Validation sécurisée (retourne success/error au lieu de throw)
export const safeValidateEvent = {
  create: (data: unknown) => CreateEventSchema.safeParse(data),
  update: (data: unknown) => UpdateEventSchema.safeParse(data),
  form: (data: unknown) => EventFormSchema.safeParse(data)
}

// Validation stricte (throw en cas d'erreur)
export const validateEvent = {
  create: (data: unknown) => CreateEventSchema.parse(data),
  update: (data: unknown) => UpdateEventSchema.parse(data),
  form: (data: unknown) => EventFormSchema.parse(data)
}

// Messages d'erreur personnalisés
export const EventErrorMessages = {
  fr: {
    required: 'Ce champ est requis',
    nameMinLength: 'Le nom doit contenir au moins 3 caractères',
    nameMaxLength: 'Le nom ne peut pas dépasser 100 caractères',
    nameInvalidChars: 'Le nom contient des caractères non autorisés',
    descriptionMinLength: 'La description doit contenir au moins 10 caractères',
    descriptionMaxLength: 'La description ne peut pas dépasser 1000 caractères',
    locationMinLength: 'Le lieu doit contenir au moins 3 caractères',
    locationMaxLength: 'Le lieu ne peut pas dépasser 200 caractères',
    invalidCoordinates: 'Coordonnées géographiques invalides',
    dateInPast: 'La date doit être dans le futur',
    invalidTimeFormat: 'Format d\'heure invalide (HH:MM)',
    participantsMin: 'Minimum 2 participants',
    participantsMax: 'Maximum 100 participants',
    invalidSpeed: 'Vitesse invalide',
    invalidDistance: 'Distance invalide',
    invalidImageUrl: 'URL d\'image invalide',
    noUpdateFields: 'Au moins un champ doit être fourni pour la mise à jour'
  }
} as const

// Utilitaires pour les sports
export const SportUtils = {
  getDisplayName: (sport: SportType): string => {
    const names = {
      foot: 'Football',
      course: 'Course à pied',
      tennis: 'Tennis',
      basket: 'Basketball',
      natation: 'Natation'
    }
    return names[sport]
  },
  
  getIcon: (sport: SportType): string => {
    const icons = {
      foot: '⚽',
      course: '🏃',
      tennis: '🎾',
      basket: '🏀',
      natation: '🏊'
    }
    return icons[sport]
  },
  
  getLevelDisplayName: (level: SportLevel): string => {
    const names = {
      debutant: 'Débutant',
      intermediaire: 'Intermédiaire',
      confirme: 'Confirmé',
      expert: 'Expert'
    }
    return names[level]
  },
  
  getLevelColor: (level: SportLevel): string => {
    const colors = {
      debutant: 'var(--color-green)',
      intermediaire: 'var(--color-orange)',
      confirme: 'var(--color-mint)',
      expert: 'var(--color-black)'
    }
    return colors[level]
  }
}
