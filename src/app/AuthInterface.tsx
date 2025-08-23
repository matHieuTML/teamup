'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function AuthInterface() {
  const { user, logout, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        color: '#666'
      }}>
        Chargement...
      </div>
    )
  }

  // Si l'utilisateur est connecté
  if (user) {
    return (
      <div style={{ 
        textAlign: 'center',
        backgroundColor: '#f0fdf4',
        border: '1px solid #dcfce7',
        borderRadius: '0.75rem',
        padding: '2rem'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '0.5rem',
            color: '#065f46'
          }}>
            ✅ Vous êtes connecté !
          </h2>
          <p style={{ color: '#047857', fontSize: '1.1rem' }}>
            Bonjour <strong>{user.displayName || user.email}</strong>
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Votre compte a été créé dans Firebase Auth + Firestore
          </p>
        </div>

        <button
          onClick={logout}
          style={{
            backgroundColor: '#dc2626',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Se déconnecter
        </button>
      </div>
    )
  }

  // Si l'utilisateur n'est pas connecté
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: '2rem'
    }}>
      {/* Onglets */}
      <div style={{ 
        display: 'flex',
        backgroundColor: '#f3f4f6',
        borderRadius: '0.5rem',
        padding: '0.25rem'
      }}>
        <button
          onClick={() => setActiveTab('login')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            backgroundColor: activeTab === 'login' ? '#fff' : 'transparent',
            color: activeTab === 'login' ? '#000' : '#6b7280',
            boxShadow: activeTab === 'login' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Connexion
        </button>
        <button
          onClick={() => setActiveTab('register')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            backgroundColor: activeTab === 'register' ? '#fff' : 'transparent',
            color: activeTab === 'register' ? '#000' : '#6b7280',
            boxShadow: activeTab === 'register' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          Inscription
        </button>
      </div>

      {/* Formulaires */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center' 
      }}>
        {activeTab === 'login' ? (
          <LoginForm />
        ) : (
          <RegisterForm />
        )}
      </div>

      {/* Note explicative */}
      <div style={{ 
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        maxWidth: '500px'
      }}>
        <p>
          <strong>Test d'authentification :</strong> Créez un compte pour tester la connexion Firebase Auth 
          et la création automatique dans Firestore (collection <code>users</code>).
        </p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
          💡 <strong>Debug :</strong> Ouvrez la console du navigateur (F12) pour voir les logs détaillés en cas d'erreur.
        </p>
      </div>

      {/* Test Firestore */}
      <FirestoreTest />
    </div>
  )
}

function FirestoreTest() {
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testFirestore = async () => {
    setIsLoading(true)
    setTestResult('')

    try {
      console.log('🔄 Test écriture Firestore...')
      const testDoc = doc(db, 'test', 'test-connection')
      await setDoc(testDoc, {
        message: 'Test de connexion',
        timestamp: new Date()
      })
      console.log('✅ Test Firestore réussi')
      setTestResult('✅ Firestore fonctionne - Problème probablement dans les règles de sécurité')
    } catch (error: any) {
      console.error('❌ Erreur test Firestore:', error)
      setTestResult(`❌ Erreur Firestore: ${error.message}`)
    }

    setIsLoading(false)
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
      <button
        onClick={testFirestore}
        disabled={isLoading}
        style={{
          backgroundColor: '#3b82f6',
          color: '#fff',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        {isLoading ? 'Test...' : 'Test Firestore'}
      </button>

      {testResult && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: testResult.startsWith('✅') ? '#059669' : '#dc2626'
        }}>
          {testResult}
        </div>
      )}
    </div>
  )
}