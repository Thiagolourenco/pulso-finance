import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyB21f_am6C6ECQGS4m49dOLSkGn99xeLoU',
  authDomain: 'pulso-finance-1d1fd.firebaseapp.com',
  projectId: 'pulso-finance-1d1fd',
  storageBucket: 'pulso-finance-1d1fd.firebasestorage.app',
  messagingSenderId: '1051806239998',
  appId: '1:1051806239998:web:c23e975ce106931ae6e9af',
  measurementId: 'G-BQK8WS5J37',
}

let app: FirebaseApp | null = null
let analyticsInstance: Analytics | null = null
let initializing = false

const getAppInstance = (): FirebaseApp | null => {
  if (typeof window === 'undefined') return null
  if (app) return app
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  return app
}

export const initAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === 'undefined') return null
  if (analyticsInstance) return analyticsInstance
  if (initializing) return null

  const currentApp = getAppInstance()
  if (!currentApp) return null

  initializing = true
  const supported = await isSupported().catch(() => false)
  if (!supported) {
    initializing = false
    return null
  }

  analyticsInstance = getAnalytics(currentApp)
  initializing = false
  return analyticsInstance
}

/**
 * Registra um evento no Analytics de forma segura (ignora em SSR/sem suporte).
 */
export const logAnalyticsEvent = async (
  name: string,
  params?: Record<string, any>
): Promise<void> => {
  const analytics = await initAnalytics()
  if (!analytics) return
  logEvent(analytics, name, params)
}

/**
 * Track de page view com caminho.
 */
export const trackPageView = async (path: string) => {
  await logAnalyticsEvent('page_view', { page_path: path })
}



