import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/Loading'

type ConfirmationStatus = 'loading' | 'success' | 'error' | 'expired'

export const Confirmation = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<ConfirmationStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Supabase envia tokens no hash da URL ou como query params
        // Formato comum: #access_token=...&type=signup
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const tokenHash = hashParams.get('access_token')
        const tokenType = hashParams.get('type') || hashParams.get('token_type')
        
        // Também verifica query params como fallback
        const tokenQuery = searchParams.get('token')
        const tokenTypeQuery = searchParams.get('type')

        const token = tokenHash || tokenQuery
        const type = tokenType || tokenTypeQuery || 'signup'

        if (!token) {
          setStatus('error')
          setErrorMessage('Token de confirmação não encontrado na URL')
          return
        }

        // Verifica o token com Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as 'signup' | 'email',
        })

        if (error) {
          // Verifica se é erro de token expirado
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setStatus('expired')
            setErrorMessage('O link de confirmação expirou ou é inválido')
          } else {
            setStatus('error')
            setErrorMessage(error.message || 'Erro ao confirmar email')
          }
          return
        }

        if (data.user) {
          setStatus('success')
          // Redireciona para o dashboard após 2 segundos
          setTimeout(() => {
            navigate('/dashboard')
          }, 2000)
        } else {
          setStatus('error')
          setErrorMessage('Não foi possível confirmar o email')
        }
      } catch (err: any) {
        setStatus('error')
        setErrorMessage(err.message || 'Erro inesperado ao confirmar email')
      }
    }

    handleConfirmation()
  }, [navigate, searchParams])

  const handleResendEmail = async () => {
    // Aqui você pode implementar reenvio de email se necessário
    navigate('/register')
  }

  if (status === 'loading') {
    return (
      <div className="animate-fade-in text-center">
        <div className="mb-6">
          <LoadingSpinner size="lg" />
        </div>
        <h2 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-2">
          Confirmando seu email...
        </h2>
        <p className="text-body text-neutral-600 dark:text-neutral-300">
          Por favor, aguarde enquanto verificamos sua conta.
        </p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="animate-fade-in text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-success-600 dark:text-success-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-2">
          Email confirmado!
        </h2>
        <p className="text-body text-neutral-600 dark:text-neutral-300 mb-6">
          Sua conta foi confirmada com sucesso. Redirecionando para o dashboard...
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/dashboard')}
          className="w-full"
        >
          Ir para o dashboard
        </Button>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="animate-fade-in text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-warning-100 dark:bg-warning-900 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-warning-600 dark:text-warning-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-2">
          Link expirado
        </h2>
        <p className="text-body text-neutral-600 dark:text-neutral-300 mb-6">
          {errorMessage || 'Este link de confirmação expirou. Por favor, solicite um novo link.'}
        </p>
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleResendEmail}
            className="w-full"
          >
            Criar nova conta
          </Button>
          <Link
            to="/login"
            className="block text-center text-body-sm text-primary-800 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 font-medium transition-colors duration-fast"
          >
            Já tem uma conta? Entrar
          </Link>
        </div>
      </div>
    )
  }

  // status === 'error'
  return (
    <div className="animate-fade-in text-center">
      <div className="mb-6">
        <div className="mx-auto w-16 h-16 bg-danger-100 dark:bg-danger-900 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-danger-600 dark:text-danger-400"
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
        </div>
      </div>
      <h2 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-2">
        Erro ao confirmar
      </h2>
      <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-950 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 rounded-input">
        {errorMessage || 'Ocorreu um erro ao confirmar seu email. Por favor, tente novamente.'}
      </div>
      <div className="space-y-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleResendEmail}
          className="w-full"
        >
          Tentar novamente
        </Button>
        <Link
          to="/login"
          className="block text-center text-body-sm text-primary-800 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 font-medium transition-colors duration-fast"
        >
          Voltar para login
        </Link>
      </div>
    </div>
  )
}

