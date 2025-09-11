import React from 'react'
import Link from 'next/link'
import { Button, Section } from '../../ui'
import '../../../styles/components/HeroSection.css'

const HeroSection = () => {
  return (
    <Section 
      background="dots" 
      padding="2xl" 
      minHeight="80vh"
      className="hero-section"
    >
      <div className="hero-section__overlay" />
      
      <div className="hero-section__content">
        <div className="hero-section__badge">
          <div className="hero-section__badge-inner">
            <div className="hero-section__badge-dot" />
            Nouveau : Version PWA disponible
          </div>
        </div>

        <h1 className="hero-section__title">
          <span className="hero-section__title-line">
            REJOIGNEZ LA
          </span>
          <span className="hero-section__title-gradient">
            TEAMUP
          </span>
          <span className="hero-section__title-line">
            COMMUNITY
          </span>
        </h1>
        
        <p className="hero-section__subtitle">
          Découvrez et participez aux événements sportifs de votre quartier. 
          Créez des connexions, restez actif, et faites partie d'une communauté 
          passionnée de sport.
        </p>

        <div className="hero-section__buttons">
          <Link href="/events">
            <Button 
              variant="gradient" 
              size="xl"
              className="hero-section__button"
            >
              Voir les événements
            </Button>
          </Link>
          <Link href="/profile">
            <Button 
              variant="secondary" 
              size="xl"
              className="hero-section__button"
            >
              Gérer mon profil
            </Button>
          </Link>
        </div>

        <div className="hero-section__stats">
          <div className="hero-section__stats-container">
            <div className="hero-section__stats-grid">
              <div className="hero-section__stat">
                <div className="hero-section__stat-number hero-section__stat-number--primary">
                  500+
                </div>
                <div className="hero-section__stat-label">
                  Événements
                </div>
              </div>

              <div className="hero-section__stat">
                <div className="hero-section__stat-number hero-section__stat-number--secondary">
                  1.2K+
                </div>
                <div className="hero-section__stat-label">
                  Membres
                </div>
              </div>

              <div className="hero-section__stat">
                <div className="hero-section__stat-number hero-section__stat-number--accent">
                  50+
                </div>
                <div className="hero-section__stat-label">
                  Sports
                </div>
              </div>
            </div>

            <div className="hero-section__stats-desktop">
              <div className="hero-section__stats-desktop-row">
                <div className="hero-section__stat">
                  <div className="hero-section__stat-number hero-section__stat-number--primary">
                    500+
                  </div>
                  <div className="hero-section__stat-label">
                    Événements
                  </div>
                </div>
                
                <div className="hero-section__stats-separator"></div>
                
                <div className="hero-section__stat">
                  <div className="hero-section__stat-number hero-section__stat-number--secondary">
                    1.2K+
                  </div>
                  <div className="hero-section__stat-label">
                    Membres
                  </div>
                </div>

                <div className="hero-section__stats-separator"></div>
                
                <div className="hero-section__stat">
                  <div className="hero-section__stat-number hero-section__stat-number--accent">
                    50+
                  </div>
                  <div className="hero-section__stat-label">
                    Sports
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Section>
  )
}

export default HeroSection