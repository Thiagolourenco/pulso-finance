import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { Input, Button } from '@/components/ui'

export const Register = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const formData: RegisterFormData = { email, password, confirmPassword }
      registerSchema.parse(formData)

      setIsLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-h1 font-bold text-neutral-900 mb-6">Criar conta</h2>

      {error && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-input animate-shake">
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

