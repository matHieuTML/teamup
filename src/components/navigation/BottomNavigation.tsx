'use client'

import React from 'react'
import NavItem from './NavItem'
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
    label: 'Create', 
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
    label: 'Profile', 
    icon: ProfileIcon, 
    path: '/profile' 
  }
]

const BottomNavigation = () => {
  return (
    <nav className="bottom-navigation">
      <div className="bottom-navigation__container">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            path={item.path}
            isPrimary={item.isPrimary}
          />
        ))}
      </div>
    </nav>
  )
}

export default BottomNavigation