'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function useAuthRedirect(requireAuth: boolean = true) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && !loading && !user) {
      const currentPath = window.location.pathname
      router.push(`/auth?redirect=${encodeURIComponent(currentPath)}`)
    }
  }, [user, loading, requireAuth, router])

  return { user, loading, isAuthenticated: !!user }
}