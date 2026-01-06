import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-transparent px-4 py-6 lg:py-0 transition-colors">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex justify-end mb-3 lg:mb-4">
          <ThemeToggle />
        </div>
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-3xl lg:text-display font-bold text-neutral-950 dark:text-neutral-50 mb-1 lg:mb-2">Pulso</h1>
          <p className="text-sm lg:text-body text-neutral-600 dark:text-neutral-300">Gerencie suas finanças pessoais</p>
        </div>
        <div className="bg-white dark:bg-neutral-950 rounded-card-lg p-6 lg:p-8 shadow-card border border-border dark:border-border-dark transition-colors">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

