'use client'

import { useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import AuthInterface from './AuthInterface'

export default function Home() {
  return (
    <AuthProvider>
      <main style={{ 
        minHeight: '100vh', 
        padding: '2rem', 
        fontFamily: 'system-ui, sans-serif' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              TeamUp
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>
              Plateforme communautaire pour événements sportifs de proximité
            </p>
          </header>

          <AuthInterface />
        </div>
      </main>
    </AuthProvider>
  )
}
