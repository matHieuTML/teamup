'use client'

import { useState } from 'react'

export default function Home() {
  return (
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

        <FirebaseTest />
      </div>
    </main>
  )
}

function FirebaseTest() {
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testFirebase = async () => {
    setIsLoading(true)
    setTestResult('Test en cours...')

    try {
      const { auth, db, storage } = await import('@/lib/firebase')
      
      let results = []
      
      // Test Auth
      if (auth) {
        results.push('✅ Firebase Auth: Connecté')
      } else {
        results.push('❌ Firebase Auth: Échec')
      }

      // Test Firestore
      if (db) {
        results.push('✅ Firebase Firestore: Connecté')
      } else {
        results.push('❌ Firebase Firestore: Échec')
      }

      // Test Storage
      if (storage) {
        results.push('✅ Firebase Storage: Connecté')
        results.push(`   📁 Bucket: ${storage.app.options.storageBucket}`)
      } else {
        results.push('❌ Firebase Storage: Échec')
      }

      // Test Messaging
      try {
        const { messaging } = await import('@/lib/firebase')
        const messagingInstance = await messaging()
        if (messagingInstance) {
          results.push('✅ Firebase Messaging: Connecté')
        } else {
          results.push('⚠️ Firebase Messaging: Non supporté (normal en dev)')
        }
      } catch (error) {
        results.push('⚠️ Firebase Messaging: Non disponible')
      }

      setTestResult(results.join('\n'))

    } catch (error) {
      setTestResult(`❌ Erreur de connexion Firebase: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }

    setIsLoading(false)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <button
        onClick={testFirebase}
        disabled={isLoading}
        style={{
          backgroundColor: '#000',
          color: '#fff',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        {isLoading ? 'Test en cours...' : 'Test de connexion Firebase'}
      </button>

      {testResult && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          whiteSpace: 'pre-line',
          fontFamily: 'monospace',
          textAlign: 'left'
        }}>
          {testResult}
        </div>
      )}
    </div>
  )
}
