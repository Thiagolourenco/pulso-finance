import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryProvider } from '@/contexts/QueryProvider'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import App from './App.tsx'
import './index.css'
import { initAnalytics } from '@/lib/firebase/analytics'

// Inicializa analytics em segundo plano (somente client)
void initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryProvider>
        <App />
      </QueryProvider>
    </ThemeProvider>
  </StrictMode>,
)
