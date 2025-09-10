'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import '../styles/components/auth-tabs.css'

export default function AuthInterface() {
  const { user, logout, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (user && !loading) {
      const redirectTo = searchParams.get('redirect')
      if (redirectTo) {
        router.push(decodeURIComponent(redirectTo))
      } else {
        router.push('/')
      }
    }
  }, [user, loading, router, searchParams])

  if (loading) {
    return (
      <div className="auth-tabs__loading">
        Chargement...
      </div>
    )
  }

  // Si l'utilisateur est connecté
  if (user) {
    return (
      <div className="auth-tabs">
        <div className="auth-tabs__status">
          <h2 className="auth-tabs__status-title">
            ✅ Vous êtes connecté !
          </h2>
          <p className="auth-tabs__status-greeting">
            Bonjour <strong>{user.displayName || user.email}</strong>
          </p>
          <p className="auth-tabs__status-info">
            Votre compte est maintenant actif
          </p>

          <button
            onClick={logout}
            className="auth-tabs__logout-button"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  // Si l'utilisateur n'est pas connecté
  return (
    <div className="auth-tabs">
      {/* Onglets modernes */}
      <div className="auth-tabs__nav">
        <button
          onClick={() => setActiveTab('login')}
          className={`auth-tabs__button ${
            activeTab === 'login' ? 'auth-tabs__button--active' : ''
          }`}
        >
          Connexion
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`auth-tabs__button ${
            activeTab === 'register' ? 'auth-tabs__button--active' : ''
          }`}
        >
          Inscription
        </button>
      </div>

      {/* Formulaires */}
      <div className="auth-tabs__content">
        <div className="auth-tabs__form-container">
          {activeTab === 'login' ? (
            <LoginForm />
          ) : (
            <RegisterForm />
          )}
        </div>
      </div>
    </div>
  )
}