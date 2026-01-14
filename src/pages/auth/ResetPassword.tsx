import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Input, Button } from '@/components/ui'
import { logAnalyticsEvent } from '@/lib/firebase/analytics'

export const ResetPassword = () => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  // Verifica se há uma sessão válida de reset
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Verifica se há um hash de recuperação na URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      if (type === 'recovery' && accessToken) {
        // Usuário veio do link de email
        setIsValidSession(true)
      } else if (session) {
        // Usuário já está logado
        setIsValidSession(true)
      } else {
        setIsValidSession(false)
      }
    }
    
    checkSession()

    // Escuta mudanças de auth (quando o token é processado)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    try {
      void logAnalyticsEvent('auth_reset_password_attempt')
      setIsLoading(true)

      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      void logAnalyticsEvent('auth_reset_password_success')
      setSuccess(true)
      
      // Redireciona para o dashboard após 2 segundos
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err: any) {
      void logAnalyticsEvent('auth_reset_password_error', { message: err?.message })
      
      // Mensagens de erro amigáveis
      let errorMessage = 'Erro ao redefinir senha'
      
      if (err?.message?.includes('same as')) {
        errorMessage = 'A nova senha deve ser diferente da senha atual'
      } else if (err?.message?.includes('weak')) {
        errorMessage = 'Senha muito fraca. Use letras, números e caracteres especiais.'
      } else if (err?.message?.includes('expired') || err?.message?.includes('invalid')) {
        errorMessage = 'Link expirado ou inválido. Solicite um novo link de recuperação.'
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="animate-fade-in text-center py-8">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-body-sm text-neutral-600 dark:text-neutral-400">Verificando...</p>
      </div>
    )
  }

  // Link inválido ou expirado
  if (!isValidSession) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-danger-600 dark:text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-h2 font-bold text-neutral-900 dark:text-neutral-50 mb-3">
          Link inválido ou expirado
        </h2>
        
        <p className="text-body-sm text-neutral-600 dark:text-neutral-300 mb-6">
          O link de recuperação pode ter expirado ou já foi utilizado. 
          Solicite um novo link para redefinir sua senha.
        </p>
        
        <div className="space-y-3">
          <Link to="/forgot-password">
            <Button variant="primary" size="lg" className="w-full">
              Solicitar novo link
            </Button>
          </Link>
          
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

  // Sucesso
  if (success) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-h2 font-bold text-neutral-900 dark:text-neutral-50 mb-3">
          Senha redefinida!
        </h2>
        
        <p className="text-body-sm text-neutral-600 dark:text-neutral-300 mb-6">
          Sua senha foi alterada com sucesso. Você será redirecionado para o dashboard...
        </p>
        
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-2">
        Redefinir senha
      </h2>
      
      <p className="text-body-sm text-neutral-600 dark:text-neutral-300 mb-6">
        Digite sua nova senha abaixo.
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
          id="password"
          type="password"
          label="Nova senha"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Mínimo de 6 caracteres"
          required
          autoFocus
        />

        <Input
          id="confirmPassword"
          type="password"
          label="Confirmar nova senha"
          placeholder="Digite novamente"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full"
        >
          Redefinir senha
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-neutral-600 dark:text-neutral-400">
        <Link
          to="/login"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
        >
          ← Voltar para login
        </Link>
      </p>
    </div>
  )
}

