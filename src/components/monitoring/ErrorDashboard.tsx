'use client'

import React, { useState, useEffect } from 'react'
import { getStoredErrors, clearStoredErrors, ErrorLog as BaseErrorLog } from '@/lib/monitoring/error-logger'
import './ErrorDashboard.css'

interface ErrorLog extends BaseErrorLog {
  id: string
}

export default function ErrorDashboard() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadErrors()
  }, [])

  const loadErrors = () => {
    setIsLoading(true)
    try {
      const storedErrors = getStoredErrors()
      const errorsWithId = storedErrors.map(error => ({
        ...error,
        id: error.id || `${error.timestamp}-${Math.random().toString(36).substr(2, 9)}`
      })) as ErrorLog[]
      setErrors(errorsWithId)
    } catch (error) {
      console.error('Erreur lors du chargement des erreurs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearErrors = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les erreurs ?')) {
      clearStoredErrors()
      setErrors([])
      setSelectedError(null)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR')
  }

  const getErrorSeverity = (message: string) => {
    if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
      return 'warning'
    }
    if (message.toLowerCase().includes('syntax') || message.toLowerCase().includes('reference')) {
      return 'error'
    }
    return 'info'
  }

  if (isLoading) {
    return (
      <div className="error-dashboard">
        <div className="error-dashboard__loading">
          Chargement des erreurs...
        </div>
      </div>
    )
  }

  return (
    <div className="error-dashboard">
      <div className="error-dashboard__header">
        <h2 className="error-dashboard__title">Monitoring des erreurs</h2>
        <div className="error-dashboard__actions">
          <button 
            onClick={loadErrors}
            className="error-dashboard__button error-dashboard__button--refresh"
          >
            Actualiser
          </button>
          <button 
            onClick={handleClearErrors}
            className="error-dashboard__button error-dashboard__button--clear"
            disabled={errors.length === 0}
          >
            Vider ({errors.length})
          </button>
        </div>
      </div>

      {errors.length === 0 ? (
        <div className="error-dashboard__empty">
          <div className="error-dashboard__empty-icon">✅</div>
          <h3>Aucune erreur détectée</h3>
          <p>Le système fonctionne correctement.</p>
        </div>
      ) : (
        <div className="error-dashboard__content">
          <div className="error-dashboard__list">
            {errors.map((error) => (
              <div
                key={error.id}
                className={`error-dashboard__item ${
                  selectedError?.id === error.id ? 'error-dashboard__item--selected' : ''
                } error-dashboard__item--${getErrorSeverity(error.message)}`}
                onClick={() => setSelectedError(error)}
              >
                <div className="error-dashboard__item-header">
                  <span className="error-dashboard__item-message">
                    {error.message.length > 60 
                      ? `${error.message.substring(0, 60)}...` 
                      : error.message
                    }
                  </span>
                  <span className="error-dashboard__item-time">
                    {formatDate(error.timestamp)}
                  </span>
                </div>
                <div className="error-dashboard__item-url">
                  {error.url}
                </div>
              </div>
            ))}
          </div>

          {selectedError && (
            <div className="error-dashboard__detail">
              <div className="error-dashboard__detail-header">
                <h3>Détails de l'erreur</h3>
                <button
                  onClick={() => setSelectedError(null)}
                  className="error-dashboard__close"
                >
                  ×
                </button>
              </div>
              
              <div className="error-dashboard__detail-content">
                <div className="error-dashboard__detail-field">
                  <label>Message:</label>
                  <div className="error-dashboard__detail-value">
                    {selectedError.message}
                  </div>
                </div>

                <div className="error-dashboard__detail-field">
                  <label>Date:</label>
                  <div className="error-dashboard__detail-value">
                    {formatDate(selectedError.timestamp)}
                  </div>
                </div>

                <div className="error-dashboard__detail-field">
                  <label>URL:</label>
                  <div className="error-dashboard__detail-value">
                    {selectedError.url}
                  </div>
                </div>

                <div className="error-dashboard__detail-field">
                  <label>Navigateur:</label>
                  <div className="error-dashboard__detail-value">
                    {selectedError.userAgent}
                  </div>
                </div>

                {selectedError.userId && (
                  <div className="error-dashboard__detail-field">
                    <label>Utilisateur:</label>
                    <div className="error-dashboard__detail-value">
                      {selectedError.userId}
                    </div>
                  </div>
                )}

                {selectedError.stack && (
                  <div className="error-dashboard__detail-field">
                    <label>Stack trace:</label>
                    <pre className="error-dashboard__stack">
                      {selectedError.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
