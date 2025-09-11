'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import styles from './PWAInstaller.module.css'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('PWA: Service Worker registered successfully:', registration.scope)
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  if (confirm('Une nouvelle version de TeamUp est disponible. Voulez-vous la charger ?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' })
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('PWA: Service Worker registration failed:', error)
        })
    }

    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      console.log('PWA: App is running in standalone mode')
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      
      setTimeout(() => {
        setShowInstallButton(true)
        console.log('PWA: Install prompt available')
      }, 1000)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallButton(false)
      setDeferredPrompt(null)
      console.log('PWA: App installed successfully')
      
      if (typeof window !== 'undefined' && 'gtag' in window) {
        const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag
        if (gtag) {
          gtag('event', 'pwa_install', {
            event_category: 'PWA',
            event_label: 'TeamUp App Installed'
          })
        }
      }
    }

    const timer = setTimeout(() => {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)
    }, 500)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt')
      } else {
        console.log('PWA: User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowInstallButton(false)
    } catch (error) {
      console.error('PWA: Error during installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallButton(false)
    setDeferredPrompt(null)
    
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled || !showInstallButton) {
    return null
  }

  const dismissedTime = localStorage.getItem('pwa-install-dismissed')
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
    return null
  }

  const isHomePage = pathname === '/'
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  
  if (isMobile && !isHomePage) {
    return null
  }

  return (
    <div className={`${styles.installBanner} ${isHomePage && isMobile ? styles.mobileTop : ''}`}>
      <div className={styles.installContent}>
        <div className={styles.installIcon}>📱</div>
        <div className={styles.installText}>
          <h3 className={styles.installTitle}>Installer TeamUp</h3>
          <p className={styles.installDescription}>
            Accédez rapidement à vos événements sportifs
          </p>
        </div>
        <div className={styles.installActions}>
          <button 
            onClick={handleInstallClick}
            className={styles.installButton}
          >
            Installer
          </button>
          <button 
            onClick={handleDismiss}
            className={styles.dismissButton}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export function usePWA() {
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('PWA: Notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/images/logo/ios/192.png',
        badge: '/images/logo/ios/96.png',
        ...options
      })
    }
  }

  return {
    isOnline,
    isInstalled,
    requestNotificationPermission,
    showNotification
  }
}
