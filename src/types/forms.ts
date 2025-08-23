export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface CreateEventFormData {
  name: string
  type: string
  description: string
  level_needed?: string
  location_name: string
  latitude: number
  longitude: number
  date: string
  time: string
  max_participants?: number
  visibility: 'public' | 'private'
}

export interface ProfileFormData {
  name: string
  location?: string
  sports_preferences: Array<{
    sport: string
    level: string
  }>
  notifications_enabled: boolean
}

export interface SearchFormData {
  query?: string
  sport?: string
  level?: string
  distance?: number
  date?: string
}