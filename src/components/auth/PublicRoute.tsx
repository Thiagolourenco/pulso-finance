import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui'

interface PublicRouteProps {
  children: ReactNode
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // Se Supabase não estiver configurado, permite acesso às rotas públicas
        const isSupabaseConfigured = 
          import.meta.env.VITE_SUPABASE_URL && 
          !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
        
        if (!isSupabaseConfigured) {
          // Para validação: não redireciona se Supabase não estiver configurado
          setIsAuthenticated(false)
        } else {
          setIsAuthenticated(!!session)
        }
      } catch (error) {
        // Se houver erro mas Supabase não estiver configurado, permite acesso
        const isSupabaseConfigured = 
          import.meta.env.VITE_SUPABASE_URL && 
          !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
        
        if (!isSupabaseConfigured) {
          setIsAuthenticated(false)
        } else {
          console.error('Error checking auth:', error)
          setIsAuthenticated(false)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isSupabaseConfigured = 
        import.meta.env.VITE_SUPABASE_URL && 
        !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
      
      // Limpa cache quando usuário faz login
      if (event === 'SIGNED_IN') {
        queryClient.clear()
      }
      
      if (!isSupabaseConfigured) {
        setIsAuthenticated(false)
      } else {
        setIsAuthenticated(!!session)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Se já estiver autenticado, redireciona para o dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

