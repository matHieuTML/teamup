'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { RegisterFormData } from '@/types/forms'
import Link from 'next/link'
import '../../styles/components/auth-forms.css'

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register, loading, error } = useAuth()
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.email || !formData.password || !formData.name) {
      setFormError('Veuillez remplir tous les champs')
      return
    }

    if (formData.password.length < 6) {
      setFormError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (!acceptedTerms) {
      setFormError('Vous devez accepter les conditions d\'utilisation')
      return
    }

    try {
      await register(formData.email, formData.password, formData.name)
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
        Inscription
      </h3>

      {(error || formError) && (
        <div className="auth-form__error">
          {error || formError}
        </div>
      )}

      <div className="auth-form__field">
        <label className="auth-form__label">
          Nom
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={loading}
          className="auth-form__input"
        />
      </div>

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
        <div className="auth-form__helper-text">
          Minimum 6 caractères
        </div>
      </div>

      <div className="auth-form__field auth-form__checkbox-field">
        <label className="auth-form__checkbox-label">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="auth-form__checkbox"
            required
          />
          <span className="auth-form__checkbox-text">
            J&apos;accepte les{' '}
            <Link href="/conditions-utilisation" className="auth-form__link">
              conditions d&apos;utilisation
            </Link>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !acceptedTerms}
        className="auth-form__submit"
      >
        {loading ? 'Inscription...' : 'S\'inscrire'}
      </button>
    </form>
  )
}