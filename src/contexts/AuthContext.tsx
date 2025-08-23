'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { AuthContextType, AuthUser, User } from '@/types/database'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      setError(getErrorMessage(error.code))
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      setError(null)
      setLoading(true)
      
      console.log('🔄 Début inscription:', { email, name })
      
      // Créer l'utilisateur Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log('✅ Utilisateur Firebase Auth créé:', userCredential.user.uid)
      
      // Mettre à jour le profil avec le nom
      await updateProfile(userCredential.user, {
        displayName: name
      })
      console.log('✅ Profil Firebase Auth mis à jour')

      // TEMPORAIRE : Sauvegarder via API route au lieu de direct Firestore
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: userCredential.user.uid,
            email: email,
            name: name
          })
        })
        
        if (response.ok) {
          console.log('✅ Utilisateur sauvé via API')
        } else {
          console.log('⚠️ Sauvegarde API échouée, mais auth OK')
        }
      } catch (apiError) {
        console.log('⚠️ API non disponible, mais auth réussie')
      }

    } catch (error: any) {
      console.error('❌ Erreur inscription:', error)
      console.error('Code erreur:', error.code)
      console.error('Message erreur:', error.message)
      setError(getErrorMessage(error.code) + ` (${error.code})`)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await signOut(auth)
    } catch (error: any) {
      setError(getErrorMessage(error.code))
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Fonction utilitaire pour traduire les erreurs Firebase
function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email ou mot de passe incorrect'
    case 'auth/email-already-in-use':
      return 'Cet email est déjà utilisé'
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères'
    case 'auth/invalid-email':
      return 'Email invalide'
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez plus tard'
    case 'auth/network-request-failed':
      return 'Erreur de connexion. Vérifiez votre internet'
    default:
      return 'Une erreur est survenue'
  }
}