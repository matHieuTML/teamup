'use client'

import React from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout'
import { 
  HeroSection, 
  EventsCarousel
} from '@/components/features/homepage'

export default function Home() {
  return (
    <AuthProvider>
      <MainLayout>
        {/* Hero Section avec titre, CTA et couleurs gradient */}
        <HeroSection />
        
        {/* Carousel d'événements avec cards horizontales */}
        <EventsCarousel />
      </MainLayout>
    </AuthProvider>
  )
}
