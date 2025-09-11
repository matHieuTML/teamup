import ErrorDashboard from '@/components/monitoring/ErrorDashboard'
import { ErrorBoundary } from '@/components/monitoring/ErrorBoundary'

export default function MonitoringPage() {
  return (
    <div className="monitoring-page">
      <ErrorBoundary>
        <ErrorDashboard />
      </ErrorBoundary>
    </div>
  )
}

export const metadata = {
  title: 'Monitoring - TeamUp',
  description: 'Dashboard de monitoring des erreurs de l\'application TeamUp'
}
