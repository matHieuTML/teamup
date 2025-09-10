'use client'

import React from 'react'
import { EventForm } from './EventForm'

interface CreateEventFormProps {
  onSuccess?: (eventId: string) => void
  onCancel?: () => void
}

export function CreateEventForm({ onSuccess, onCancel }: CreateEventFormProps) {
  return (
    <EventForm 
      mode="create"
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  )
}
