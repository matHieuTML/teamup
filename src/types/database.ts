export interface User {
  id: string
  email: string
  name: string
  birth_date?: Date
  location?: string
  sports_preferences: SportPreference[]
  number_event_created: number
  number_event_joined: number
  number_message_sent: number
  notifications_enabled: boolean
  profile_picture_url?: string
  deleted_at?: Date
}

export interface SportPreference {
  sport: SportType
  level: SportLevel
}

export enum SportType {
  FOOT = 'foot',
  COURSE = 'course', 
  TENNIS = 'tennis',
  BASKET = 'basket',
  NATATION = 'natation',
}

export enum SportLevel {
  DEBUTANT = 'debutant',
  INTERMEDIAIRE = 'intermediaire',
  CONFIRME = 'confirme',
  EXPERT = 'expert'
}

export interface Event {
  id: string
  name: string
  type: SportType
  description: string
  level_needed?: SportLevel
  location_name: string
  location_id?: string
  latitude: number
  longitude: number
  picture_url?: string
  competent_trainer: boolean
  date: Date
  average_speed?: number
  distance?: number
  max_participants?: number
  created_by: string
  created_at: Date
  updated_at: Date
  visibility: EventVisibility
}

export enum EventVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

export interface UserEvent {
  id_user: string
  id_event: string
  role: UserEventRole
  joined_at: Date
}

export enum UserEventRole {
  ORGANISATEUR = 'organisateur',
  PARTICIPANT = 'participant', 
  OBSERVATEUR = 'observateur'
}

export interface Message {
  id: number
  id_event: string
  id_user: string
  time: Date
  content: string
  from_organizer: boolean
}

export interface Location {
  latitude: number
  longitude: number
  name?: string
}