import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const OnboardingLayout = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-4xl">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex flex-col">
            <span className="text-body-sm text-neutral-600 dark:text-neutral-300">Pulso</span>
            <h1 className="text-h3 font-semibold text-neutral-900 dark:text-neutral-50">Configuração inicial</h1>
          </div>
          <ThemeToggle />
        </div>

        <Outlet />
      </div>
    </div>
  )
}


