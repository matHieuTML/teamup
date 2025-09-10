'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItemProps {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>
  path: string
  isPrimary?: boolean
}

const NavItem = ({ id, label, icon: Icon, path, isPrimary = false }: NavItemProps) => {
  const pathname = usePathname()
  const isActive = path === '/' 
    ? pathname === '/' 
    : pathname === path || pathname.startsWith(path + '/')

  if (isPrimary) {
    return (
      <Link href={path} className="nav-item nav-item--primary">
        <div className="nav-item--primary-button">
          <Icon 
            size={26} 
            color="white"
            className="nav-item--primary-icon"
          />
        </div>
        <span className="nav-item--primary-label">
          {label}
        </span>
      </Link>
    )
  }

  return (
    <Link href={path} className="nav-item nav-item--regular">
      {isActive && (
        <div className="nav-item__active-indicator" />
      )}
      
      <div className={`nav-item__icon-container ${
        isActive 
          ? 'nav-item__icon-container--active' 
          : 'nav-item__icon-container--inactive'
      }`}>
        <Icon 
          size={22} 
          color={isActive ? 'var(--color-primary)' : 'var(--color-black)'}
          className={`nav-item__icon ${
            isActive ? 'nav-item__icon--active' : 'nav-item__icon--inactive'
          }`}
        />
      </div>
      <span className={`nav-item__label ${
        isActive 
          ? 'nav-item__label--active' 
          : 'nav-item__label--inactive'
      }`}>
        {label}
      </span>
    </Link>
  )
}

export default NavItem