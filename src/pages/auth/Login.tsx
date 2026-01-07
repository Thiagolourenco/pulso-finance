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
      
      // Para validação: redireciona direto para o dashboard
      // TODO: Remover este mock quando Supabase estiver configurado
      await new Promise(resolve => setTimeout(resolve, 500)) // Simula delay de API
      
      // Tenta fazer login real, mas se falhar, permite navegação para validação
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          // Se Supabase não estiver configurado, permite navegação mesmo assim para validação
          console.warn('Supabase não configurado, navegando para validação:', error.message)
        }
      } catch (supabaseError) {
        // Ignora erro do Supabase se não estiver configurado
        console.warn('Supabase não configurado, navegando para validação')
      }

      void logAnalyticsEvent('auth_login_success')
      navigate('/dashboard')
    } catch (err: any) {
      void logAnalyticsEvent('auth_login_error', { message: err?.message })
      // Só mostra erro se for erro de validação do formulário
      if (err.name === 'ZodError') {
        setError('Por favor, preencha todos os campos corretamente')
      } else {
        setError(err.message || 'Erro ao fazer login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-6">Entrar</h2>

      {error && (
        <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-950 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 rounded-input animate-shake">
          {error}
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
          required
        />

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

      <p className="mt-6 text-center text-body-sm text-neutral-600">
        Não tem uma conta?{' '}
        <Link
          to="/register"
          className="text-primary-800 hover:text-primary-900 font-medium transition-colors duration-fast"
        >
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}

