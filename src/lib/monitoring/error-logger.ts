export interface ErrorLog {
  id?: string
  timestamp: string
  message: string
  stack?: string
  url: string
  userAgent: string
  userId?: string
}

class ErrorLogger {
  private static instance: ErrorLogger
  private logs: ErrorLog[] = []
  private maxLogs = 100 // Limiter à 100 erreurs en mémoire

  private constructor() {
    // Capturer les erreurs JavaScript globales
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.logError(event.error, {
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      })

      // Capturer les promesses rejetées
      window.addEventListener('unhandledrejection', (event) => {
        this.logError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      })
    }
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  logError(error: Error | string, context?: { url?: string; userAgent?: string; userId?: string }) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      url: context?.url || (typeof window !== 'undefined' ? window.location.href : ''),
      userAgent: context?.userAgent || (typeof window !== 'undefined' ? navigator.userAgent : ''),
      userId: context?.userId
    }

    this.logs.push(errorLog)

    // Garder seulement les dernières erreurs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Log en console pour le développement
    console.error('[ERROR LOGGER]', errorLog)

    // Sauvegarder dans localStorage si disponible
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('teamup_error_logs', JSON.stringify(this.logs))
      } catch {
        // Ignorer si localStorage est plein
      }
    }
  }

  getLogs(): ErrorLog[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('teamup_error_logs')
    }
  }

  // Méthode pour envoyer les logs à un endpoint (optionnel)
  async sendLogs() {
    if (this.logs.length === 0) return

    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: this.logs })
      })
      this.clearLogs()
    } catch (error) {
      console.error('Failed to send error logs:', error)
    }
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance()

// Helper function pour log des erreurs manuellement
export const logError = (error: Error | string, context?: { userId?: string }) => {
  errorLogger.logError(error, {
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    ...context
  })
}

// Export functions for dashboard
export const getStoredErrors = (): ErrorLog[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem('teamup_error_logs')
    if (stored) {
      const logs = JSON.parse(stored) as ErrorLog[]
      return logs.map(log => ({
        ...log,
        id: `${log.timestamp}-${Math.random().toString(36).substr(2, 9)}`
      }))
    }
  } catch (error) {
    console.error('Error reading stored logs:', error)
  }
  
  return errorLogger.getLogs().map(log => ({
    ...log,
    id: `${log.timestamp}-${Math.random().toString(36).substr(2, 9)}`
  }))
}

export const clearStoredErrors = () => {
  errorLogger.clearLogs()
}
