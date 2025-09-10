import React from 'react'
import '../../styles/ui/Section.css'

interface SectionProps {
  children: React.ReactNode
  className?: string
  background?: 'default' | 'dots' | 'dots-dark' | 'polygon' | 'gradient' | 'glass' | 'hero' | 'modern'
  padding?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  container?: boolean
  minHeight?: 'screen' | '80vh' | '60vh' | 'auto'
}

const Section = ({
  children,
  className = '',
  background = 'default',
  padding = 'lg',
  container = true,
  minHeight = 'auto'
}: SectionProps) => {
  const sectionClasses = [
    'section',
    `section--${background}`,
    `section--padding-${padding}`,
    minHeight !== 'auto' ? `section--height-${minHeight}` : '',
    className
  ].filter(Boolean).join(' ')

  const content = container ? (
    <div className="section__container">
      {children}
    </div>
  ) : children

  return (
    <section className={sectionClasses}>
      {content}
    </section>
  )
}

export default Section