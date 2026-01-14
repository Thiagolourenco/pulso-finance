import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { Input, Button } from '@/components/ui'
import { logAnalyticsEvent } from '@/lib/firebase/analytics'

export const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      void logAnalyticsEvent('auth_login_attempt', { email })

      const formData: LoginFormData = { email, password }
      loginSchema.parse(formData)

      setIsLoading(true)
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      void logAnalyticsEvent('auth_login_success')
      navigate('/dashboard')
    } catch (err: any) {
      void logAnalyticsEvent('auth_login_error', { message: err?.message })
      
      // Mensagens de erro amigáveis
      let errorMessage = 'Erro ao fazer login'
      
      if (err.name === 'ZodError') {
        errorMessage = 'Por favor, preencha todos os campos corretamente'
      } else if (err?.message?.includes('Invalid login credentials') || err?.message?.includes('invalid_credentials')) {
        errorMessage = 'Email ou senha incorretos. Verifique seus dados e tente novamente.'
      } else if (err?.message?.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.'
      } else if (err?.message?.includes('Too many requests') || err?.message?.includes('rate limit')) {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
      } else if (err?.message?.includes('Network') || err?.message?.includes('fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-6">Entrar</h2>

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
          error={error && !email ? 'Email é obrigatório' : undefined}
          required
        />

        <div>
          <Input
            id="password"
            type="password"
            label="Senha"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error && !password ? 'Senha é obrigatória' : undefined}
            required
          />
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-body-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full"
        >
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-neutral-600 dark:text-neutral-400">
        Não tem uma conta?{' '}
        <Link
          to="/register"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
        >
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}
