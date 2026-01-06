import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { signOut } from '@/lib/supabase/middleware'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { supabase } from '@/lib/supabase/client'
import { getOnboardingStatus, setOnboardingCompleted, SKIP_ONBOARDING_EMAILS } from '@/services/userProfileService'
import { Onboarding } from '@/pages/onboarding/Onboarding'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Transações', href: '/transactions', icon: '💳' },
  { name: 'Contas', href: '/accounts', icon: '🏦' },
  { name: 'Cartões', href: '/cards', icon: '💳' },
  { name: 'Categorias', href: '/categories', icon: '📁' },
  { name: 'Metas', href: '/goals', icon: '🎯' },
  { name: 'Insights', href: '/insights', icon: '💡' },
  { name: 'Relatórios', href: '/reports', icon: '📈' },
  { name: 'Configurações', href: '/settings', icon: '⚙️' },
]

export const DashboardLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      // Limpa todo o cache do React Query para evitar dados de outro usuário
      queryClient.clear()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleNavClick = () => {
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    let isMounted = true

    const refresh = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id ?? null

        // Usuários antigos (allowlist): não precisam ver onboarding
        const email = (user?.email || '').toLowerCase()
        if (email && SKIP_ONBOARDING_EMAILS.has(email)) {
          await setOnboardingCompleted(userId, true)
          if (isMounted) setShowOnboarding(false)
          return
        }

        const status = await getOnboardingStatus(userId)
        if (isMounted) setShowOnboarding(status.completed === false)
      } catch {
        const status = await getOnboardingStatus(null)
        if (isMounted) setShowOnboarding(status.completed === false)
      }
    }

    refresh()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refresh()
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!showOnboarding) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [showOnboarding])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-transparent transition-colors">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-neutral-950/70 dark:backdrop-blur-xl border-b border-border dark:border-border-dark z-40 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Abrir menu"
        >
          <svg
            className="w-6 h-6 text-neutral-900 dark:text-neutral-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-neutral-950 dark:text-neutral-50">Pulso</h1>
        <ThemeToggle />
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop fixa, Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-64 bg-white dark:bg-neutral-950/70 dark:backdrop-blur-xl border-r border-border dark:border-border-dark z-50 transition-transform duration-300',
          'lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header da sidebar */}
          <div className="flex items-center justify-between h-14 lg:h-16 border-b border-border dark:border-border-dark px-4 lg:px-6">
            <h1 className="text-xl lg:text-2xl font-bold text-neutral-950 dark:text-neutral-50">Pulso</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {/* Botão fechar mobile */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Fechar menu"
              >
                <svg
                  className="w-5 h-5 text-neutral-900 dark:text-neutral-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Navegação */}
          <nav className="flex-1 px-3 lg:px-4 py-4 lg:py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-3 lg:px-4 py-2.5 rounded-lg transition-all duration-fast',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98]',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-neutral-50'
                  )}
                >
                  <span className="text-base lg:text-lg">{item.icon}</span>
                  <span className="text-sm lg:text-body-sm">{item.name}</span>
                </Link>
              )
            })}
          </nav>
          
          {/* Footer da sidebar */}
          <div className="p-3 lg:p-4 border-t border-border dark:border-border-dark">
            <button
              onClick={handleSignOut}
              className="w-full px-3 lg:px-4 py-2 text-sm font-medium text-danger-600 dark:text-danger-400 rounded-lg hover:bg-danger-100 dark:hover:bg-danger-900 active:scale-[0.98] transition-all duration-fast"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Onboarding modal overlay (primeiro acesso) */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-8">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-5xl">
            <Onboarding onCompleted={() => setShowOnboarding(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

