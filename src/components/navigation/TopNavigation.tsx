'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, EventsIcon, CreateIcon, PlacesIcon, ProfileIcon } from '../icons'
import '../../styles/layout/navigation.css'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>
  path: string
  isPrimary?: boolean
}

const navItems: NavItem[] = [
  { 
    id: 'home', 
    label: 'Home', 
    icon: HomeIcon, 
    path: '/' 
  },
  { 
    id: 'events', 
    label: 'Events', 
    icon: EventsIcon, 
    path: '/events' 
  },
  { 
    id: 'create', 
    label: 'Teamup', 
    icon: CreateIcon, 
    path: '/create', 
    isPrimary: true 
  },
  { 
    id: 'places', 
    label: 'Places', 
    icon: PlacesIcon, 
    path: '/places' 
  },
  { 
    id: 'profile', 
    label: 'Profil', 
    icon: ProfileIcon, 
    path: '/profile' 
  }
]

const TopNavigation = () => {
  const pathname = usePathname()

  return (
    <nav className="top-navigation">
      <div className="top-navigation__container">
        {/* Logo/Brand */}
        <div className="top-navigation__brand">
          <Link href="/" className="top-navigation__logo">
            <span className="top-navigation__logo-text">TeamUp</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="top-navigation__nav">
          {navItems.map((item) => {
            const isActive = item.path === '/' 
              ? pathname === '/' 
              : pathname === item.path || pathname.startsWith(item.path + '/')

            if (item.isPrimary) {
              return (
                <Link 
                  key={item.id}
                  href={item.path as any} 
                  className="top-nav-item top-nav-item--primary"
                >
                  <div className="top-nav-item--primary-button">
                    <item.icon 
                      size={20} 
                      color="white"
                      className="top-nav-item--primary-icon"
                    />
                  </div>
                  <span className="top-nav-item--primary-label">
                    {item.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link 
                key={item.id}
                href={item.path as any} 
                className={`top-nav-item ${isActive ? 'top-nav-item--active' : ''}`}
              >
                <item.icon 
                  size={20} 
                  color={isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'}
                  className="top-nav-item__icon"
                />
                <span className="top-nav-item__label">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default TopNavigation
