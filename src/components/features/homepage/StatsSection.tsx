import React from 'react'
import { Section, Card, Button } from '../../ui'

const StatsSection = () => {
  const stats = [
    {
      number: "1,200+",
      label: "Membres actifs",
      description: "Rejoignez une communauté grandissante de sportifs passionnés",
      color: "primary"
    },
    {
      number: "500+",
      label: "Événements organisés",
      description: "Des activités sportives diverses pour tous les niveaux",
      color: "secondary"
    },
    {
      number: "50+",
      label: "Sports différents",
      description: "Du football au yoga, trouvez votre activité préférée",
      color: "accent"
    },
    {
      number: "98%",
      label: "Satisfaction",
      description: "Nos membres recommandent TeamUp à leurs amis",
      color: "primary"
    }
  ]

  const values = [
    {
      title: "Inclusivité",
      description: "Tous les niveaux et tous les âges sont les bienvenus dans notre communauté.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )
    },
    {
      title: "Proximité",
      description: "Découvrez des événements sportifs dans votre quartier et créez du lien local.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      )
    },
    {
      title: "Spontanéité",
      description: "Organisez ou rejoignez des activités sportives en quelques clics seulement.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      )
    }
  ]

  return (
    <Section background="modern" padding="2xl" className="relative overflow-hidden">
      {/* Ultra-modern background avec patterns */}
      <div className="absolute inset-0 pattern-dots-light opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-orange-10)] via-transparent to-[var(--color-mint-10)] opacity-50" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Ultra-modern Header */}
        <div className="text-center mb-20">
          <div className="
            inline-flex items-center gap-2 px-4 py-2
            bg-[var(--glass-bg)] backdrop-filter backdrop-blur-lg
            border border-[var(--glass-border)]
            rounded-full text-sm font-medium
            text-[var(--color-black)] mb-6
          ">
            <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse" />
            Impact communautaire
          </div>

          <h2 className="
            text-5xl md:text-6xl lg:text-7xl
            font-black font-heading
            text-[var(--color-black)]
            mb-8 leading-[0.9]
          ">
            <span className="block mb-2">
              NOTRE IMPACT
            </span>
            <span className="
              gradient-text
              text-transparent bg-clip-text
            ">
              COMMUNAUTÉ
            </span>
          </h2>
          <p className="
            text-xl md:text-2xl text-[var(--color-black)] opacity-75
            max-w-4xl mx-auto
            font-body leading-relaxed
          ">
            TeamUp rassemble les passionnés de sport autour de valeurs communes 
            et d'un engagement fort pour le bien-être collectif de notre communauté.
          </p>
        </div>

        {/* Ultra-modern Stats Grid avec glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <Card 
              key={index}
              variant="glass-strong"
              className="
                text-center p-8
                transform-gpu hover:scale-110 hover:-translate-y-3
                transition: var(--transition-bounce)
                shadow-[var(--shadow-lg)]
                hover:shadow-[var(--shadow-xl)]
              "
            >
              <div className={`
                text-5xl md:text-6xl font-black font-heading mb-4
                ${stat.color === 'primary' ? 'text-[var(--color-primary)]' : ''}
                ${stat.color === 'secondary' ? 'text-[var(--color-secondary)]' : ''}
                ${stat.color === 'accent' ? 'text-[var(--color-accent)]' : ''}
                animate-pulse
              `}>
                {stat.number}
              </div>
              <h3 className="font-heading font-bold text-xl mb-3 text-[var(--color-black)] uppercase">
                {stat.label}
              </h3>
              <p className="text-[var(--color-black)] opacity-75 font-body leading-relaxed">
                {stat.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Ultra-modern Values Section */}
        <div className="text-center mb-16">
          <h3 className="
            text-4xl md:text-5xl font-black font-heading
            text-[var(--color-black)]
            mb-4 uppercase
          ">
            Nos <span className="gradient-text text-transparent bg-clip-text">Valeurs</span>
          </h3>
          <p className="text-lg text-[var(--color-black)] opacity-70 font-body max-w-2xl mx-auto">
            Les principes qui guident notre communauté sportive au quotidien
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {values.map((value, index) => (
            <Card 
              key={index}
              variant="glass-strong"
              className="
                text-center p-8
                transform-gpu hover:scale-105 hover:-translate-y-2
                transition: var(--transition-bounce)
                shadow-[var(--shadow-lg)]
              "
            >
              <div className="
                w-16 h-16 mx-auto mb-6
                bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)]
                rounded-[var(--radius-xl)]
                flex items-center justify-center
                text-white
                shadow-[var(--shadow-mint)]
                transform-gpu hover:scale-110 hover:rotate-3
                transition: var(--transition-bounce)
              ">
                {value.icon}
              </div>
              <h4 className="font-heading font-bold text-2xl mb-4 text-[var(--color-black)] uppercase">
                {value.title}
              </h4>
              <p className="text-[var(--color-black)] opacity-75 font-body leading-relaxed text-lg">
                {value.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Ultra-modern Call to Action */}
        <div className="text-center mt-24">
          <Card variant="glass-strong" className="inline-block p-12 max-w-3xl">
            <div className="
              inline-flex items-center gap-2 px-4 py-2
              bg-[var(--glass-bg)] backdrop-filter backdrop-blur-lg
              border border-[var(--glass-border)]
              rounded-full text-sm font-medium
              text-[var(--color-black)] mb-6
            ">
              <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
              Rejoignez-nous maintenant
            </div>

            <h3 className="
              text-4xl md:text-5xl font-black font-heading
              text-[var(--color-black)]
              mb-6 leading-tight uppercase
            ">
              Prêt à faire partie de
              <span className="block gradient-text text-transparent bg-clip-text">
                L'AVENTURE ?
              </span>
            </h3>
            <p className="
              text-xl text-[var(--color-black)] opacity-75
              mb-10 font-body leading-relaxed max-w-2xl mx-auto
            ">
              Rejoignez des milliers de sportifs qui ont déjà adopté TeamUp 
              et découvrez une nouvelle manière de vivre le sport en communauté.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                variant="gradient" 
                size="xl"
                className="min-w-[250px] shadow-[var(--shadow-orange)]"
              >
                Rejoindre la communauté
              </Button>
              <Button 
                variant="glass" 
                size="xl"
                className="min-w-[200px]"
              >
                Découvrir plus
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Section>
  )
}

export default StatsSection