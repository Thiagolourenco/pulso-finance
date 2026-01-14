import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Input, Button } from '@/components/ui'
import { logAnalyticsEvent } from '@/lib/firebase/analytics'

export const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !email.includes('@')) {
      setError('Por favor, insira um email válido')
      return
    }

    try {
      void logAnalyticsEvent('auth_forgot_password_attempt', { email })
      setIsLoading(true)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      void logAnalyticsEvent('auth_forgot_password_success')
      setSuccess(true)
    } catch (err: any) {
      void logAnalyticsEvent('auth_forgot_password_error', { message: err?.message })
      
      // Mensagens de erro amigáveis
      let errorMessage = 'Erro ao enviar email de recuperação'
      
      if (err?.message?.includes('rate limit')) {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
      } else if (err?.message?.includes('not found') || err?.message?.includes('User not found')) {
        errorMessage = 'Email não encontrado. Verifique se digitou corretamente.'
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h2 className="text-h2 font-bold text-neutral-900 dark:text-neutral-50 mb-3">
          Email enviado!
        </h2>
        
        <p className="text-body-sm text-neutral-600 dark:text-neutral-300 mb-6">
          Enviamos um link de recuperação para <strong className="text-neutral-900 dark:text-neutral-50">{email}</strong>. 
          Verifique sua caixa de entrada e spam.
        </p>
        
        <div className="space-y-3">
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => {
              setSuccess(false)
              setEmail('')
            }}
          >
            Enviar novamente
          </Button>
          
          <Link
            to="/login"
            className="block text-body-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            ← Voltar para login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-2">
        Esqueceu a senha?
      </h2>
      
      <p className="text-body-sm text-neutral-600 dark:text-neutral-300 mb-6">
        Digite seu email e enviaremos um link para redefinir sua senha.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-lg animate-shake">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-body-sm text-danger-700 dark:text-danger-300">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full"
        >
          Enviar link de recuperação
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-neutral-600 dark:text-neutral-400">
        Lembrou a senha?{' '}
        <Link
          to="/login"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
        >
          Voltar para login
        </Link>
      </p>
    </div>
  )
}

