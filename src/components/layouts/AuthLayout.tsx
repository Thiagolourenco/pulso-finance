import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 transition-colors">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-display font-bold text-neutral-950 dark:text-neutral-50 mb-2">Pulso</h1>
          <p className="text-body text-neutral-600 dark:text-neutral-300">Gerencie suas finanças pessoais</p>
        </div>
        <div className="bg-white dark:bg-neutral-950 rounded-card-lg p-8 shadow-card border border-border dark:border-border-dark transition-colors">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

