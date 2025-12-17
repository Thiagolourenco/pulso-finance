import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center lg:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal - Mobile: full screen bottom sheet, Desktop: centered */}
      <div
        className={cn(
          'relative bg-white dark:bg-neutral-950 rounded-t-2xl lg:rounded-card-lg shadow-2xl w-full lg:w-auto',
          'h-[90vh] lg:h-auto lg:max-h-[90vh] flex flex-col',
          sizes[size],
          'animate-slide-up lg:animate-scale-in z-10 transition-colors border-t lg:border border-border dark:border-border-dark'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-border dark:border-border-dark flex-shrink-0">
          <h2 className="text-lg lg:text-h2 font-semibold text-neutral-950 dark:text-neutral-50 pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-fast p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 flex-shrink-0"
            aria-label="Fechar"
          >
            <svg
              className="w-5 h-5"
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

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

