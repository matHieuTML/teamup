'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoginFormData } from '@/types/forms'
import '../../styles/components/auth-forms.css'

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, loading, error } = useAuth()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.email || !formData.password) {
      setFormError('Veuillez remplir tous les champs')
      return
    }


    try {
      await login(formData.email, formData.password)
      onSuccess?.()
    } catch (error) {
      // L'erreur est déjà gérée dans le contexte
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h3 className="auth-form__title">
        Connexion
      </h3>

      {(error || formError) && (
        <div className="auth-form__error">
          {error || formError}
        </div>
      )}

      <div className="auth-form__field">
        <label className="auth-form__label">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
          className="auth-form__input"
        />
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label">
          Mot de passe
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
          className="auth-form__input"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="auth-form__submit"
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  )
}