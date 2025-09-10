import React from 'react'
import '../../styles/layout/layouts.css'

interface AuthLayoutProps {
  children: React.ReactNode
  className?: string
}

const AuthLayout = ({ children, className = '' }: AuthLayoutProps) => {
  return (
    <div className={`auth-layout ${className}`}>
      <main className="auth-layout__main">
        <div className="auth-layout__container">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AuthLayout