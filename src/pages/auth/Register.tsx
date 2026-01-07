import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { Input, Button } from '@/components/ui'
import { logAnalyticsEvent } from '@/lib/firebase/analytics'

export const Register = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    console.log('🔵 [Register] Iniciando cadastro...')

    try {
      void logAnalyticsEvent('auth_register_attempt', { email })

      const formData: RegisterFormData = { email, password, confirmPassword }
      console.log('🔵 [Register] Dados do formulário:', { email, passwordLength: password.length, confirmPasswordLength: confirmPassword.length })
      
      console.log('🔵 [Register] Validando schema...')
      registerSchema.parse(formData)
      console.log('✅ [Register] Schema validado com sucesso')

      setIsLoading(true)
      console.log('🔵 [Register] Chamando supabase.auth.signUp...')
      console.log('🔵 [Register] Email:', email)
      console.log('🔵 [Register] EmailRedirectTo:', `${window.location.origin}/confirmation/signUp`)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirmation/signUp`,
        },
      })

      console.log('🔵 [Register] Resposta do signUp:', { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        hasSession: !!data?.session,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        error: error ? { message: error.message, status: error.status, name: error.name } : null
      })

      if (error) {
        console.error('❌ [Register] Erro do Supabase:', error)
        console.error('❌ [Register] Detalhes do erro:', {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        })
        throw error
      }

      console.log('✅ [Register] SignUp executado sem erros')
      void logAnalyticsEvent('auth_register_success')

      // Verifica se precisa confirmar email
      if (data.user && !data.session) {
        console.log('🔵 [Register] Usuário criado, mas precisa confirmar email')
        console.log('🔵 [Register] User ID:', data.user.id)
        console.log('🔵 [Register] User Email:', data.user.email)
        // Email precisa ser confirmado
        setSuccess('Conta criada! Verifique seu email para confirmar a conta.')
        // Aguarda um pouco e redireciona para login
        setTimeout(() => {
          console.log('🔵 [Register] Redirecionando para /login após 3s')
          navigate('/login')
        }, 3000)
      } else if (data.session) {
        console.log('🔵 [Register] Login automático - sessão criada')
        console.log('🔵 [Register] Session:', data.session?.user?.id)
        // Login automático (quando email confirmation está desabilitado)
        navigate('/dashboard')
      } else {
        console.warn('⚠️ [Register] Caso inesperado: sem user e sem session')
        console.warn('⚠️ [Register] Data completo:', JSON.stringify(data, null, 2))
        navigate('/login')
      }
    } catch (err: any) {
      void logAnalyticsEvent('auth_register_error', { message: err?.message })
      console.error('❌ [Register] Erro capturado no catch:', err)
      console.error('❌ [Register] Tipo do erro:', typeof err)
      console.error('❌ [Register] Nome do erro:', err?.name)
      console.error('❌ [Register] Mensagem do erro:', err?.message)
      console.error('❌ [Register] Stack do erro:', err?.stack)
      
      if (err?.issues) {
        console.error('❌ [Register] Erros de validação Zod:', err.issues)
      }
      
      const errorMessage = err?.message || err?.toString() || 'Erro ao criar conta'
      console.error('❌ [Register] Mensagem de erro final:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
      console.log('🔵 [Register] Finalizando handleSubmit (isLoading = false)')
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-6">Criar conta</h2>

      {error && (
        <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-950 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 rounded-input animate-shake">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-300 rounded-input">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="email"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error && !email ? 'Email é obrigatório' : undefined}
          required
        />

        <Input
          id="password"
          type="password"
          label="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error && !password ? 'Senha é obrigatória' : undefined}
          helperText="Mínimo de 6 caracteres"
          required
        />

        <Input
          id="confirmPassword"
          type="password"
          label="Confirmar senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={
            error && password !== confirmPassword
              ? 'As senhas não coincidem'
              : undefined
          }
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full"
        >
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-neutral-600">
        Já tem uma conta?{' '}
        <Link
          to="/login"
          className="text-primary-800 hover:text-primary-900 font-medium transition-colors duration-fast"
        >
          Entrar
        </Link>
      </p>
    </div>
  )
}

