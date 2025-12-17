import { useEffect, useState } from 'react'
import { Button, Input } from '@/components/ui'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { supabase } from '@/lib/supabase/client'
import { signOut } from '@/lib/supabase/middleware'
import { useQueryClient } from '@tanstack/react-query'

export const Settings = () => {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState<string>('')
  const [loadingUser, setLoadingUser] = useState(true)
  const [toast, setToast] = useState<string>('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setEmail(user?.email || '')
        // Nome vem do user_metadata (Supabase Auth)
        const metaName =
          (user?.user_metadata as any)?.name ||
          (user?.user_metadata as any)?.full_name ||
          ''
        setName(typeof metaName === 'string' ? metaName : '')
      } finally {
        setLoadingUser(false)
      }
    }
    load()
  }, [])

  const handleExportData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Export simples (JSON) - útil para backup
    const [transactions, accounts, cards, categories] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id),
      supabase.from('accounts').select('*').eq('user_id', user.id),
      supabase.from('cards').select('*').eq('user_id', user.id),
      supabase.from('categories').select('*').eq('user_id', user.id),
    ])

    const payload = {
      exportedAt: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      transactions: transactions.data || [],
      accounts: accounts.data || [],
      cards: cards.data || [],
      categories: categories.data || [],
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pulso-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSignOut = async () => {
    await signOut()
    queryClient.clear()
  }

  const handleSaveProfile = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setToast('Informe um nome para salvar.')
      setTimeout(() => setToast(''), 2000)
      return
    }

    setSavingProfile(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: trimmed },
      })
      if (error) throw error
      setToast('Nome atualizado com sucesso!')
      setTimeout(() => setToast(''), 2000)
    } catch (e: any) {
      setToast(e?.message || 'Erro ao atualizar nome.')
      setTimeout(() => setToast(''), 2500)
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-border">
        <h1 className="text-xl lg:text-h1 font-bold text-neutral-900 dark:text-neutral-50 mb-1">Configurações</h1>
        <p className="text-sm lg:text-body-sm text-neutral-500 dark:text-neutral-400">
          Preferências, conta e dados
        </p>
      </div>

      {toast && (
        <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 rounded-input">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Aparência */}
        <div className="bg-white dark:bg-neutral-950 rounded-card-lg p-4 lg:p-6 border border-border dark:border-border-dark">
          <h2 className="text-lg lg:text-h3 font-semibold text-neutral-900 dark:text-neutral-50 mb-1">Aparência</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Tema e preferências visuais
          </p>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border dark:border-border-dark">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Tema</p>
              <p className="text-caption text-neutral-500 dark:text-neutral-400">Alternar claro/escuro</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Conta */}
        <div className="bg-white dark:bg-neutral-950 rounded-card-lg p-4 lg:p-6 border border-border dark:border-border-dark">
          <h2 className="text-lg lg:text-h3 font-semibold text-neutral-900 dark:text-neutral-50 mb-1">Conta</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Informações e sessão
          </p>

          <div className="space-y-3 mb-4">
            <Input
              label="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              disabled={loadingUser || savingProfile}
            />

            <div className="p-3 rounded-lg border border-border dark:border-border-dark">
              <p className="text-caption text-neutral-500 dark:text-neutral-400 mb-1">Email</p>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {loadingUser ? 'Carregando…' : (email || '—')}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Button
              variant="primary"
              className="w-full"
              onClick={handleSaveProfile}
              isLoading={savingProfile}
              disabled={loadingUser}
            >
              Salvar nome
            </Button>
          </div>

          <Button
            variant="danger"
            className="w-full"
            onClick={async () => {
              await handleSignOut()
              setToast('Você saiu da conta.')
            }}
          >
            Sair da conta
          </Button>
        </div>

        {/* Dados */}
        <div className="bg-white dark:bg-neutral-950 rounded-card-lg p-4 lg:p-6 border border-border dark:border-border-dark lg:col-span-2">
          <h2 className="text-lg lg:text-h3 font-semibold text-neutral-900 dark:text-neutral-50 mb-1">Dados</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Exportar e utilitários
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleExportData}
            >
              📥 Exportar backup (JSON)
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                queryClient.clear()
                setToast('Cache atualizado.')
                setTimeout(() => setToast(''), 2000)
              }}
            >
              🔄 Atualizar dados
            </Button>
          </div>

          <div className="mt-4 p-4 rounded-lg border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-950">
            <p className="text-sm font-medium text-warning-700 dark:text-warning-300 mb-1">Observação</p>
            <p className="text-caption text-warning-700/90 dark:text-warning-300/90">
              O backup exporta seus dados do Supabase (por usuário). Guarde com cuidado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}










