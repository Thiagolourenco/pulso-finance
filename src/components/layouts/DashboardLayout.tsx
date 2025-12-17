import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from '@/lib/supabase/middleware'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

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

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors">
      {/* Sidebar fixa */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-neutral-950 border-r border-border dark:border-border-dark z-10 transition-colors">
        <div className="flex flex-col h-full">
          {/* Header da sidebar */}
          <div className="flex items-center justify-between h-16 border-b border-border dark:border-border-dark px-6">
            <h1 className="text-2xl font-bold text-neutral-950 dark:text-neutral-50">Pulso</h1>
            <ThemeToggle />
          </div>
          
          {/* Navegação */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-fast',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98]',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-neutral-50'
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-body-sm">{item.name}</span>
                </Link>
              )
            })}
          </nav>
          
          {/* Footer da sidebar */}
          <div className="p-4 border-t border-border dark:border-border-dark">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-sm font-medium text-danger-600 dark:text-danger-400 rounded-lg hover:bg-danger-100 dark:hover:bg-danger-900 active:scale-[0.98] transition-all duration-fast"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

