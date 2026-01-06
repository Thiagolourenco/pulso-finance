import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui'

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // Se Supabase não estiver configurado (erro ou URL placeholder), permite acesso para validação
        const isSupabaseConfigured = 
          import.meta.env.VITE_SUPABASE_URL && 
          !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
        
        if (!isSupabaseConfigured) {
          // Para validação: permite acesso mesmo sem Supabase configurado
          setIsAuthenticated(true)
        } else {
          const userId = session?.user?.id || null
          
          // Se o usuário mudou, limpa o cache
          if (currentUserId && userId && currentUserId !== userId) {
            queryClient.clear()
          }
          
          setCurrentUserId(userId)
          setIsAuthenticated(!!session)
        }
      } catch (error) {
        // Se houver erro mas Supabase não estiver configurado, permite acesso para validação
        const isSupabaseConfigured = 
          import.meta.env.VITE_SUPABASE_URL && 
          !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
        
        if (!isSupabaseConfigured) {
          setIsAuthenticated(true)
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
      
      if (!isSupabaseConfigured) {
        setIsAuthenticated(true)
      } else {
        const userId = session?.user?.id || null
        
        // Limpa cache quando usuário faz logout ou quando muda de usuário
        if (event === 'SIGNED_OUT' || (currentUserId && userId && currentUserId !== userId)) {
          queryClient.clear()
        }
        
        setCurrentUserId(userId)
        setIsAuthenticated(!!session)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient, currentUserId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

