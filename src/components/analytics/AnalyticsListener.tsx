import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '@/lib/firebase/analytics'

export const AnalyticsListener = () => {
  const location = useLocation()

  useEffect(() => {
    // dispara page_view a cada mudança de rota
    trackPageView(location.pathname + location.search).catch(() => {
      // ignora erros silenciosamente
    })
  }, [location])

  return null
}


