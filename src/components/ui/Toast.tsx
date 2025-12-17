import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export const Toast = ({ message, type = 'info', isVisible, onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const styles = {
    success: 'bg-success-100 dark:bg-success-900 border-success-200 dark:border-success-800 text-success-600 dark:text-success-500',
    error: 'bg-danger-100 dark:bg-danger-900 border-danger-200 dark:border-danger-800 text-danger-600 dark:text-danger-400',
    info: 'bg-info-100 dark:bg-info-900 border-info-200 dark:border-info-800 text-info-500 dark:text-info-400',
  }

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }

  const toast = (
    <div className="fixed top-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-auto z-50 animate-slide-in">
      <div
        className={cn(
          'flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-card border shadow-lg w-full lg:min-w-[300px] lg:max-w-md',
          styles[type]
        )}
      >
        <span className="text-lg lg:text-xl font-bold flex-shrink-0">{icons[type]}</span>
        <p className="flex-1 text-sm lg:text-body-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-current opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
          aria-label="Fechar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )

  return createPortal(toast, document.body)
}

