import { z } from 'zod'

// Énumérations pour les sports et niveaux
export const SportTypeSchema = z.enum(['foot', 'course', 'tennis', 'basket', 'natation'])

export const SportLevelSchema = z.enum(['debutant', 'intermediaire', 'confirme', 'expert'])

// Schéma pour une préférence sportive
export const SportPreferenceSchema = z.object({
  sport: SportTypeSchema,
  level: SportLevelSchema
})

// Schéma pour la création d'un profil utilisateur
export const CreateUserProfileSchema = z.object({
  id: z.string().min(1, 'ID utilisateur requis'),
  email: z.string().email('Email invalide'),
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets'),
  birth_date: z.date().optional().refine(
    (date) => !date || date <= new Date(),
    'La date de naissance ne peut pas être dans le futur'
  ).refine(
    (date) => !date || date >= new Date('1900-01-01'),
    'La date de naissance doit être après 1900'
  ),
  location: z.string()
    .min(2, 'La localisation doit contenir au moins 2 caractères')
    .max(100, 'La localisation ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
  sports_preferences: z.array(SportPreferenceSchema)
    .max(5, 'Maximum 5 sports autorisés')
    .optional()
    .default([])
    .refine(
      (prefs) => {
        if (!prefs || prefs.length === 0) return true
        const sportTypes = prefs.map(p => p.sport)
        return new Set(sportTypes).size === sportTypes.length
      },
      'Chaque sport ne peut être sélectionné qu\'une seule fois'
    )
})

// Schéma pour la mise à jour d'un profil utilisateur
export const UpdateUserProfileSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets')
    .optional(),
  location: z.string()
    .min(2, 'La localisation doit contenir au moins 2 caractères')
    .max(100, 'La localisation ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
  birth_date: z.date().optional().refine(
    (date) => !date || date <= new Date(),
    'La date de naissance ne peut pas être dans le futur'
  ).refine(
    (date) => !date || date >= new Date('1900-01-01'),
    'La date de naissance doit être après 1900'
  ),
  notifications_enabled: z.boolean().optional(),
  sports_preferences: z.array(SportPreferenceSchema)
    .max(5, 'Maximum 5 sports autorisés')
    .optional()
    .refine(
      (prefs) => {
        if (!prefs || prefs.length === 0) return true
        const sportTypes = prefs.map(p => p.sport)
        return new Set(sportTypes).size === sportTypes.length
      },
      'Chaque sport ne peut être sélectionné qu\'une seule fois'
    ),
  profile_picture_url: z.string()
    .url('URL d\'image invalide')
    .optional()
    .or(z.literal(''))
}).refine(
  (data) => Object.keys(data).length > 0,
  'Au moins un champ doit être fourni pour la mise à jour'
)

// Schéma pour la photo de profil
export const ProfilePictureSchema = z.object({
  picture_url: z.string().url('URL d\'image invalide')
})

// Schéma pour les préférences sportives
export const SportsPreferencesSchema = z.object({
  sports_preferences: z.array(SportPreferenceSchema)
    .min(0, 'Liste de sports requise')
    .max(5, 'Maximum 5 sports autorisés')
    .refine(
      (prefs) => {
        if (prefs.length === 0) return true
        const sportTypes = prefs.map(p => p.sport)
        return new Set(sportTypes).size === sportTypes.length
      },
      'Chaque sport ne peut être sélectionné qu\'une seule fois'
    )
})

// Schéma pour l'ajout d'un sport
export const AddSportSchema = z.object({
  sport: SportTypeSchema,
  level: SportLevelSchema
})

// Schéma pour la validation des formulaires côté client
export const ProfileFormSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  location: z.string()
    .max(100, 'La localisation ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
  birth_date: z.string()
    .optional()
    .or(z.literal(''))
    .refine(
      (date) => {
        if (!date) return true
        const parsedDate = new Date(date)
        return parsedDate <= new Date()
      },
      'La date de naissance ne peut pas être dans le futur'
    )
    .refine(
      (date) => {
        if (!date) return true
        const parsedDate = new Date(date)
        return parsedDate >= new Date('1900-01-01')
      },
      'La date de naissance doit être après 1900'
    ),
  notifications_enabled: z.boolean()
})

// Types TypeScript dérivés des schémas
export type SportType = z.infer<typeof SportTypeSchema>
export type SportLevel = z.infer<typeof SportLevelSchema>
export type SportPreference = z.infer<typeof SportPreferenceSchema>
export type CreateUserProfileData = z.infer<typeof CreateUserProfileSchema>
export type UpdateUserProfileData = z.infer<typeof UpdateUserProfileSchema>
export type ProfilePictureData = z.infer<typeof ProfilePictureSchema>
export type SportsPreferencesData = z.infer<typeof SportsPreferencesSchema>
export type AddSportData = z.infer<typeof AddSportSchema>
export type ProfileFormData = z.infer<typeof ProfileFormSchema>

// Utilitaires de validation
export const validateProfile = {
  create: (data: unknown) => CreateUserProfileSchema.parse(data),
  update: (data: unknown) => UpdateUserProfileSchema.parse(data),
  profilePicture: (data: unknown) => ProfilePictureSchema.parse(data),
  sportsPreferences: (data: unknown) => SportsPreferencesSchema.parse(data),
  addSport: (data: unknown) => AddSportSchema.parse(data),
  form: (data: unknown) => ProfileFormSchema.parse(data)
}

// Validation sécurisée (retourne success/error au lieu de throw)
export const safeValidateProfile = {
  create: (data: unknown) => CreateUserProfileSchema.safeParse(data),
  update: (data: unknown) => UpdateUserProfileSchema.safeParse(data),
  profilePicture: (data: unknown) => ProfilePictureSchema.safeParse(data),
  sportsPreferences: (data: unknown) => SportsPreferencesSchema.safeParse(data),
  addSport: (data: unknown) => AddSportSchema.safeParse(data),
  form: (data: unknown) => ProfileFormSchema.safeParse(data)
}

// Messages d'erreur personnalisés pour l'internationalisation
export const ProfileErrorMessages = {
  fr: {
    required: 'Ce champ est requis',
    invalidEmail: 'Email invalide',
    nameMinLength: 'Le nom doit contenir au moins 2 caractères',
    nameMaxLength: 'Le nom ne peut pas dépasser 50 caractères',
    nameInvalidChars: 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets',
    locationMaxLength: 'La localisation ne peut pas dépasser 100 caractères',
    birthDateFuture: 'La date de naissance ne peut pas être dans le futur',
    birthDateTooOld: 'La date de naissance doit être après 1900',
    maxSportsReached: 'Maximum 5 sports autorisés',
    duplicateSport: 'Chaque sport ne peut être sélectionné qu\'une seule fois',
    invalidSportType: 'Sport non valide',
    invalidSportLevel: 'Niveau non valide',
    invalidImageUrl: 'URL d\'image invalide',
    noUpdateFields: 'Au moins un champ doit être fourni pour la mise à jour'
  }
} as const