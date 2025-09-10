'use client'

import React from 'react'
import { Button } from '../../ui'
import '../../../styles/components/EventsCarousel.css'

const EventsCarousel = () => {
  // Données placeholder pour les événements
  const placeholderEvents = [
    { id: 1, title: "Football entre amis", location: "Parc Central", participants: 8, maxParticipants: 12 },
    { id: 2, title: "Course matinale", location: "Bord de Seine", participants: 15, maxParticipants: 20 },
    { id: 3, title: "Tennis débutant", location: "Club Municipal", participants: 4, maxParticipants: 8 },
    { id: 4, title: "Basket 3x3", location: "Terrain Quartier", participants: 6, maxParticipants: 6 },
    { id: 5, title: "Yoga en plein air", location: "Jardin Public", participants: 12, maxParticipants: 15 },
  ]

  return (
    <div className="events-carousel">
      <div className="events-carousel__container">
        <div className="events-carousel__header">
          <div className="events-carousel__badge">
            <div className="events-carousel__badge-dot"></div>
            Populaire
          </div>
          
          <h2 className="events-carousel__title">
            ÉVÉNEMENTS POPULAIRES
          </h2>
          <p className="events-carousel__subtitle">
            Découvrez les activités sportives les plus populaires près de chez vous
          </p>
        </div>

        <div className="events-carousel__list">
          {placeholderEvents.map((event) => (
            <div key={event.id} className="events-carousel__item">
              <div className="events-carousel__card">
                <div className="events-carousel__card-header">
                  <div className="events-carousel__popular-tag">
                    Populaire
                  </div>
                </div>
                
                <div className="events-carousel__image">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10,8 16,12 10,16 10,8"/>
                  </svg>
                </div>

                <div>
                  <h3 className="events-carousel__event-title">
                    {event.title.toUpperCase()}
                  </h3>
                  
                  <div className="events-carousel__location">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {event.location}
                  </div>

                  <div className="events-carousel__participants-row">
                    <div className="events-carousel__participants-info">
                      <div className="events-carousel__avatars">
                        {[...Array(Math.min(3, event.participants))].map((_, i) => (
                          <div key={i} className={`events-carousel__avatar events-carousel__avatar--${i + 1}`}>
                            {i + 1}
                          </div>
                        ))}
                        {event.participants > 3 && (
                          <div className="events-carousel__avatar events-carousel__avatar--extra">
                            +{event.participants - 3}
                          </div>
                        )}
                      </div>
                      <span className="events-carousel__participants-count">
                        {event.participants}/{event.maxParticipants}
                      </span>
                    </div>

                    <div className={`events-carousel__status-tag ${
                      event.participants < event.maxParticipants 
                        ? 'events-carousel__status-tag--available' 
                        : 'events-carousel__status-tag--full'
                    }`}>
                      {event.participants < event.maxParticipants ? 'PLACES LIBRES' : 'COMPLET'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="events-carousel__cta">
          <Button variant="primary" size="lg">
            Voir tous les événements →
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EventsCarousel