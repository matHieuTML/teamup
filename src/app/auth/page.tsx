'use client'

import React from 'react'
import { MainLayout } from '@/components/layout'
import AuthInterface from '../AuthInterface'
import '../../styles/components/auth-page.css'

export default function AuthPage() {
  return (
    <MainLayout className="auth-page">
      <div className="auth-page__background">
        <div className="auth-page__container">
          <div className="auth-page__card">
            <div className="auth-page__header">
              <h1 className="auth-page__title">
                <span className="auth-page__title-line">REJOIGNEZ</span>
                <span className="auth-page__title-gradient">TEAMUP</span>
              </h1>
              <p className="auth-page__subtitle">
                Connectez-vous ou créez votre compte pour accéder à tous les événements sportifs
              </p>
            </div>
            <AuthInterface />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}