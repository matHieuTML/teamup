'use client'

import React from 'react'
import { BottomNavigation } from '../navigation'
import '../../styles/layout/layouts.css'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

const MainLayout = ({ children, className = '' }: MainLayoutProps) => {
  return (
    <div className={`main-layout ${className}`}>
      <main className="main-layout__main">
        {children}
      </main>
      
      <BottomNavigation />
    </div>
  )
}

export default MainLayout