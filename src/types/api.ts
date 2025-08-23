import { Event, User, Message } from './database'

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface EventsResponse {
  events: Event[]
  total: number
  page: number
  hasMore: boolean
}

export interface EventFilters {
  sport?: string
  level?: string
  distance?: number
  date_from?: string
  date_to?: string
  latitude?: number
  longitude?: number
  radius?: number
}

export interface CreateEventRequest {
  name: string
  type: string
  description: string
  level_needed?: string
  location_name: string
  latitude: number
  longitude: number
  date: string
  max_participants?: number
  visibility?: string
}

export interface UpdateProfileRequest {
  name?: string
  location?: string
  sports_preferences?: Array<{
    sport: string
    level: string
  }>
  notifications_enabled?: boolean
}

export interface MessageRequest {
  content: string
}

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}