import React from 'react'
import '../../styles/ui/Card.css'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'glass-strong' | 'polygon' | 'gradient' | 'modern'
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
}

const Card = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = true
}: CardProps) => {
  const cardClasses = [
    'card',
    `card--${variant}`,
    `card--padding-${padding}`,
    hover ? 'card--hoverable' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClasses}>
      {children}
    </div>
  )
}

export default Card