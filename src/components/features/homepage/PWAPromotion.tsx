import React from 'react'
import { Button, Section } from '../../ui'
import '../../../styles/components/PWAPromotion.css'

const PWAPromotion = () => {
  return (
    <Section background="hero" padding="2xl" className="pwa-promotion">
      <div className="pwa-promotion__overlay" />
      
      <div className="pwa-promotion__container">
        <div className="pwa-promotion__card">
          <div className="pwa-promotion__header">
            <div className="pwa-promotion__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>

            <div className="pwa-promotion__badge">
              <div className="pwa-promotion__badge-dot" />
              Installation en un clic
            </div>
          </div>

          <h2 className="pwa-promotion__title">
            <span className="pwa-promotion__title-line">
              INSTALLEZ
            </span>
            <span className="pwa-promotion__title-gradient">
              TEAMUP
            </span>
            <span className="pwa-promotion__title-subtitle">
              sur votre téléphone
            </span>
          </h2>
          
          <p className="pwa-promotion__description">
            Accédez instantanément à tous vos événements sportifs. 
            Notre Progressive Web App ultra-moderne offre une expérience native 
            sans passer par les stores d'applications.
          </p>

          <div className="pwa-promotion__features">
            <div className="pwa-promotion__feature">
              <div className="pwa-promotion__feature-card">
                <div className="pwa-promotion__feature-icon pwa-promotion__feature-icon--primary">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <h3 className="pwa-promotion__feature-title">ULTRA RAPIDE</h3>
                <p className="pwa-promotion__feature-description">
                  Chargement instantané même hors ligne avec notre technologie avancée
                </p>
              </div>
            </div>

            <div className="pwa-promotion__feature">
              <div className="pwa-promotion__feature-card">
                <div className="pwa-promotion__feature-icon pwa-promotion__feature-icon--secondary">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="m13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <h3 className="pwa-promotion__feature-title">NOTIFICATIONS</h3>
                <p className="pwa-promotion__feature-description">
                  Restez informé en temps réel de tous vos événements sportifs
                </p>
              </div>
            </div>

            <div className="pwa-promotion__feature">
              <div className="pwa-promotion__feature-card">
                <div className="pwa-promotion__feature-icon pwa-promotion__feature-icon--accent">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10,8 16,12 10,16 10,8"/>
                  </svg>
                </div>
                <h3 className="pwa-promotion__feature-title">SANS INSTALLATION</h3>
                <p className="pwa-promotion__feature-description">
                  Aucun téléchargement depuis les stores - Direct dans votre navigateur
                </p>
              </div>
            </div>
          </div>

          <div className="pwa-promotion__buttons">
            <Button 
              variant="gradient" 
              size="xl"
              className="pwa-promotion__button pwa-promotion__button--primary"
            >
              Installer TeamUp PWA
            </Button>
            <Button 
              variant="glass" 
              size="xl"
              className="pwa-promotion__button"
            >
              En savoir plus
            </Button>
          </div>
          
          <div className="pwa-promotion__compatibility">
            <div className="pwa-promotion__compatibility-item">
              <div className="pwa-promotion__compatibility-dot pwa-promotion__compatibility-dot--primary" />
              iOS Compatible
            </div>
            <div className="pwa-promotion__compatibility-item">
              <div className="pwa-promotion__compatibility-dot pwa-promotion__compatibility-dot--secondary" />
              Android Compatible
            </div>
            <div className="pwa-promotion__compatibility-item">
              <div className="pwa-promotion__compatibility-dot pwa-promotion__compatibility-dot--accent" />
              Desktop Compatible
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

export default PWAPromotion