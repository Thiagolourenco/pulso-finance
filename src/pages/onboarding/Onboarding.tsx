import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Card, CurrencyInput, Input } from '@/components/ui'
import { AddAccountForm } from '@/components/forms/AddAccountForm'
import { AddCardForm } from '@/components/forms/AddCardForm'
import { supabase } from '@/lib/supabase/client'
import { accountService } from '@/services/accountService'
import { cardService } from '@/services/cardService'
import { goalService } from '@/services/goalService'
import { categoryService } from '@/services/categoryService'
import { setOnboardingCompleted, upsertUserProfile } from '@/services/userProfileService'

type StepId = 'welcome' | 'goal' | 'budget' | 'invested' | 'accounts' | 'cards' | 'done'

type LocalAccountDraft = {
  name: string
  type: 'checking' | 'savings' | 'investment'
  balance: number
}

type LocalCardDraft = {
  name: string
  limit: number
  closing_day: number
  due_day: number
}

type LocalGoalDraft = {
  name: string
  target: number
}

type CategoryLimitDraft = {
  categoryName: string
  limit: number
}

export const Onboarding = ({ onCompleted }: { onCompleted?: () => void }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const steps: { id: StepId; title: string; description: string }[] = useMemo(
    () => [
      { id: 'welcome', title: 'Bem-vindo', description: 'Vamos configurar o básico em poucos minutos.' },
      { id: 'goal', title: 'Sua meta', description: 'Defina um objetivo pra manter foco.' },
      { id: 'budget', title: 'Limite mensal', description: 'Qual seu limite de gasto por mês?' },
      { id: 'invested', title: 'Investimentos', description: 'Quanto você já tem investido?' },
      { id: 'accounts', title: 'Contas', description: 'Adicione suas contas (banco, carteira, investimento).' },
      { id: 'cards', title: 'Cartões', description: 'Adicione seus cartões de crédito.' },
      { id: 'done', title: 'Tudo pronto', description: 'Revise e finalize.' },
    ],
    []
  )

  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const activeStep = steps[activeStepIndex]

  // Step data
  const [fullName, setFullName] = useState('')
  const [goals, setGoals] = useState<LocalGoalDraft[]>([{ name: '', target: 0 }])
  const [monthlyLimit, setMonthlyLimit] = useState(0)
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimitDraft[]>([])
  const [investedValue, setInvestedValue] = useState(0)

  const [accounts, setAccounts] = useState<LocalAccountDraft[]>([])
  const [cards, setCards] = useState<LocalCardDraft[]>([])

  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [showAddCategoryLimit, setShowAddCategoryLimit] = useState(false)
  const [newCategoryLimitName, setNewCategoryLimitName] = useState('')
  const [newCategoryLimitValue, setNewCategoryLimitValue] = useState(0)

  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const progress = Math.round(((activeStepIndex + 1) / steps.length) * 100)

  const goNext = () => {
    setError(null)
    setActiveStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const goBack = () => {
    setError(null)
    setActiveStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const validateStep = () => {
    if (activeStep.id === 'welcome') {
      if (!fullName.trim()) return 'Informe seu nome para continuar.'
    }
    if (activeStep.id === 'goal') {
      const hasValidGoal = goals.some(g => g.name.trim() && g.target > 0)
      if (!hasValidGoal) return 'Adicione pelo menos uma meta com nome e valor maior que zero.'
    }
    if (activeStep.id === 'budget') {
      if (monthlyLimit <= 0) return 'Informe um limite mensal maior que zero.'
    }
    return null
  }

  const handleContinue = () => {
    const stepError = validateStep()
    if (stepError) {
      setError(stepError)
      return
    }
    goNext()
  }

  const handleFinish = async () => {
    setError(null)
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id ?? null

      await upsertUserProfile(userId, {
        full_name: fullName.trim(),
        monthly_spending_limit: monthlyLimit,
        onboarding_completed: true,
      })

      // Criar metas
      if (userId) {
        for (const goal of goals) {
          if (goal.name.trim() && goal.target > 0) {
            await goalService.create({
              user_id: userId,
              name: goal.name.trim(),
              target_amount: goal.target,
              current_amount: 0,
              target_date: null,
            })
          }
        }
      }

      // Criar categorias default
      if (userId) {
        const defaultCategories = [
          { name: 'Supermercado', type: 'expense' as const, icon: '🛒', color: '#10B981' },
          { name: 'Fastfood', type: 'expense' as const, icon: '🍔', color: '#F59E0B' },
          { name: 'Farmacia', type: 'expense' as const, icon: '💊', color: '#EF4444' },
          { name: 'Saude', type: 'expense' as const, icon: '🏥', color: '#8B5CF6' },
        ]

        for (const cat of defaultCategories) {
          try {
            await categoryService.create({
              user_id: userId,
              name: cat.name,
              type: cat.type,
              icon: cat.icon,
              color: cat.color,
            })
          } catch (err: any) {
            // Ignora erro se categoria já existe
            console.warn(`Categoria ${cat.name} já existe ou erro ao criar:`, err.message)
          }
        }

        // Salvar limites por categoria definidos no onboarding
        if (categoryLimits.length > 0) {
          for (const catLimit of categoryLimits) {
            try {
              // Busca a categoria pelo nome
              const { data: category } = await supabase
                .from('categories')
                .select('id')
                .eq('user_id', userId)
                .eq('name', catLimit.categoryName.trim())
                .eq('type', 'expense')
                .maybeSingle()

              if (category?.id && catLimit.limit > 0) {
                // Atualiza a categoria com o limite
                await categoryService.update(category.id, {
                  monthly_limit: catLimit.limit,
                })
              }
            } catch (err: any) {
              console.warn(`Erro ao salvar limite para categoria ${catLimit.categoryName}:`, err.message)
            }
          }
        }
      }

      // Se o usuário informou investimentos, cria uma conta de investimento padrão
      if (userId && investedValue > 0) {
        await accountService.create({
          user_id: userId,
          name: 'Investimentos',
          type: 'investment',
          initial_balance: investedValue,
          current_balance: investedValue,
        })
      }

      // Criar contas adicionais (se houver)
      if (userId && accounts.length > 0) {
        for (const acc of accounts) {
          await accountService.create({
            user_id: userId,
            name: acc.name,
            type: acc.type === 'checking' ? 'bank' : acc.type === 'savings' ? 'cash' : 'investment',
            initial_balance: acc.balance,
            current_balance: acc.balance,
          })
        }
      }

      // Criar cartões (se houver)
      if (userId && cards.length > 0) {
        for (const c of cards) {
          await cardService.create({
            user_id: userId,
            name: c.name,
            credit_limit: c.limit,
            closing_day: c.closing_day,
            due_day: c.due_day,
          })
        }
      }

      await setOnboardingCompleted(userId, true)
      
      // Invalida queries para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['user_profile'] })
      
      if (onCompleted) {
        onCompleted()
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao finalizar onboarding')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption text-neutral-600 dark:text-neutral-300">
            Passo {activeStepIndex + 1} de {steps.length} • {activeStep.title}
          </span>
          <span className="text-caption text-neutral-600 dark:text-neutral-300">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-h2 font-semibold text-neutral-900 dark:text-neutral-50">{activeStep.title}</h2>
            <p className="mt-1 text-body-sm text-neutral-600 dark:text-neutral-300">{activeStep.description}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-950 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 rounded-input animate-shake">
              {error}
            </div>
          )}

          <div key={activeStep.id} className="animate-slide-in">
            {activeStep.id === 'welcome' && (
              <div className="space-y-5">
                <Input
                  label="Como você quer ser chamado?"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 rounded-card border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
                    <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Dica</p>
                    <p className="text-caption text-neutral-600 dark:text-neutral-300 mt-1">
                      Essa configuração é rápida e você pode editar depois em Configurações.
                    </p>
                  </div>
                  <div className="p-4 rounded-card border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
                    <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Privacidade</p>
                    <p className="text-caption text-neutral-600 dark:text-neutral-300 mt-1">
                      Usamos esses dados só para personalizar sua experiência.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeStep.id === 'goal' && (
              <div className="space-y-5">
                {goals.map((goal, index) => (
                  <div key={index} className="p-4 rounded-card border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">
                        Meta {index + 1}
                      </span>
                      {goals.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setGoals(goals.filter((_, i) => i !== index))}
                          className="text-danger-600 dark:text-danger-400"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                    <Input
                      label="Qual é sua meta?"
                      value={goal.name}
                      onChange={(e) => {
                        const newGoals = [...goals]
                        newGoals[index].name = e.target.value
                        setGoals(newGoals)
                      }}
                      placeholder="Ex: Reserva de emergência"
                      required
                    />
                    <CurrencyInput
                      label="Quanto você quer juntar?"
                      value={goal.target}
                      onChange={(value) => {
                        const newGoals = [...goals]
                        newGoals[index].target = value
                        setGoals(newGoals)
                      }}
                      required
                    />
                  </div>
                ))}
                <Button
                  variant="secondary"
                  onClick={() => setGoals([...goals, { name: '', target: 0 }])}
                  className="w-full"
                >
                  + Adicionar outra meta
                </Button>
              </div>
            )}

            {activeStep.id === 'budget' && (
              <div className="space-y-5">
                <CurrencyInput
                  label="Limite de gasto por mês"
                  value={monthlyLimit}
                  onChange={setMonthlyLimit}
                  helperText="Ajuda a acompanhar se você está gastando acima do planejado."
                  required
                />
                
                <div className="pt-4 border-t border-border dark:border-border-dark">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-body font-semibold text-neutral-900 dark:text-neutral-50">
                        Limites por categoria (opcional)
                      </h3>
                      <p className="text-caption text-neutral-600 dark:text-neutral-300 mt-1">
                        Defina limites específicos para categorias de gasto
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowAddCategoryLimit(true)}
                    >
                      + Adicionar
                    </Button>
                  </div>

                  {categoryLimits.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {categoryLimits.map((catLimit, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-input border border-border dark:border-border-dark bg-white/70 dark:bg-neutral-900/20"
                        >
                          <div className="flex flex-col">
                            <span className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">
                              {catLimit.categoryName}
                            </span>
                            <span className="text-caption text-neutral-600 dark:text-neutral-300">
                              Limite mensal
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-50">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(catLimit.limit)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCategoryLimits(categoryLimits.filter((_, i) => i !== index))}
                              className="text-danger-600 dark:text-danger-400"
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showAddCategoryLimit && (
                    <div className="p-4 rounded-card border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30 space-y-3">
                      <Input
                        label="Nome da categoria"
                        value={newCategoryLimitName}
                        onChange={(e) => setNewCategoryLimitName(e.target.value)}
                        placeholder="Ex: Supermercado"
                      />
                      <CurrencyInput
                        label="Limite mensal"
                        value={newCategoryLimitValue}
                        onChange={setNewCategoryLimitValue}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setShowAddCategoryLimit(false)
                            setNewCategoryLimitName('')
                            setNewCategoryLimitValue(0)
                          }}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => {
                            if (newCategoryLimitName.trim() && newCategoryLimitValue > 0) {
                              setCategoryLimits([
                                ...categoryLimits,
                                { categoryName: newCategoryLimitName.trim(), limit: newCategoryLimitValue }
                              ])
                              setNewCategoryLimitName('')
                              setNewCategoryLimitValue(0)
                              setShowAddCategoryLimit(false)
                            }
                          }}
                          className="flex-1"
                          disabled={!newCategoryLimitName.trim() || newCategoryLimitValue <= 0}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeStep.id === 'invested' && (
              <div className="space-y-5">
                <CurrencyInput
                  label="Valor investido (opcional)"
                  value={investedValue}
                  onChange={setInvestedValue}
                  helperText="Se você informar, criaremos uma conta de investimento padrão."
                />
              </div>
            )}

            {activeStep.id === 'accounts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-body-sm text-neutral-600 dark:text-neutral-300">
                    Adicione pelo menos uma conta para começar (opcional, mas recomendado).
                  </p>
                  <Button variant="secondary" onClick={() => setShowAddAccount(true)}>
                    + Adicionar
                  </Button>
                </div>

                {accounts.length > 0 && (
                  <div className="space-y-2">
                    {accounts.map((acc, idx) => (
                      <div
                        key={`${acc.name}-${idx}`}
                        className="flex items-center justify-between p-3 rounded-input border border-border dark:border-border-dark bg-white/70 dark:bg-neutral-900/20"
                      >
                        <div className="flex flex-col">
                          <span className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">{acc.name}</span>
                          <span className="text-caption text-neutral-600 dark:text-neutral-300">
                            {acc.type === 'checking' ? 'Banco' : acc.type === 'savings' ? 'Carteira' : 'Investimento'}
                          </span>
                        </div>
                        <span className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-50">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {showAddAccount && (
                  <div className="p-4 rounded-card border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
                    <AddAccountForm
                      onCancel={() => setShowAddAccount(false)}
                      onSubmit={(data) => {
                        setAccounts((prev) => [...prev, data])
                        setShowAddAccount(false)
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {activeStep.id === 'cards' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-body-sm text-neutral-600 dark:text-neutral-300">Adicione seus cartões (opcional).</p>
                  <Button variant="secondary" onClick={() => setShowAddCard(true)}>
                    + Adicionar
                  </Button>
                </div>

                {cards.length > 0 && (
                  <div className="space-y-2">
                    {cards.map((c, idx) => (
                      <div
                        key={`${c.name}-${idx}`}
                        className="flex items-center justify-between p-3 rounded-input border border-border dark:border-border-dark bg-white/70 dark:bg-neutral-900/20"
                      >
                        <div className="flex flex-col">
                          <span className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">{c.name}</span>
                          <span className="text-caption text-neutral-600 dark:text-neutral-300">
                            Fecha dia {c.closing_day} • Vence dia {c.due_day}
                          </span>
                        </div>
                        <span className="text-body-sm font-semibold text-neutral-900 dark:text-neutral-50">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.limit)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {showAddCard && (
                  <div className="p-4 rounded-card border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
                    <AddCardForm
                      onCancel={() => setShowAddCard(false)}
                      onSubmit={(data) => {
                        setCards((prev) => [...prev, data])
                        setShowAddCard(false)
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {activeStep.id === 'done' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 rounded-card border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
                    <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Nome</p>
                    <p className="text-body-sm text-neutral-600 dark:text-neutral-300 mt-1">{fullName || '—'}</p>
                  </div>
                  <div className="p-4 rounded-card border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
                    <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Limite mensal</p>
                    <p className="text-body-sm text-neutral-600 dark:text-neutral-300 mt-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyLimit || 0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-card border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
                    <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Metas</p>
                    <div className="text-body-sm text-neutral-600 dark:text-neutral-300 mt-1 space-y-1">
                      {goals.filter(g => g.name.trim() && g.target > 0).length > 0 ? (
                        goals
                          .filter(g => g.name.trim() && g.target > 0)
                          .map((goal, idx) => (
                            <p key={idx}>
                              {goal.name} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.target)}
                            </p>
                          ))
                      ) : (
                        <p>—</p>
                      )}
                    </div>
                  </div>
                  <div className="p-4 rounded-card border border-border dark:border-border-dark bg-neutral-50 dark:bg-neutral-900/30">
                    <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">Investimentos</p>
                    <p className="text-body-sm text-neutral-600 dark:text-neutral-300 mt-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investedValue || 0)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-3">
                  <Button variant="secondary" onClick={() => setActiveStepIndex(0)} disabled={isSaving}>
                    Revisar
                  </Button>
                  <Button variant="primary" onClick={handleFinish} isLoading={isSaving} className="lg:ml-auto">
                    Finalizar e ir para o Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 lg:px-8 py-4 border-t border-border dark:border-border-dark flex items-center justify-between">
          <Button variant="ghost" onClick={goBack} disabled={activeStepIndex === 0 || isSaving}>
            Voltar
          </Button>

          {activeStep.id !== 'done' ? (
            <div className="flex items-center gap-2">
              {activeStep.id === 'accounts' || activeStep.id === 'cards' || activeStep.id === 'invested' ? (
                <Button variant="secondary" onClick={goNext} disabled={isSaving}>
                  Pular
                </Button>
              ) : null}
              <Button variant="primary" onClick={handleContinue} disabled={isSaving}>
                Continuar
              </Button>
            </div>
          ) : (
            <div />
          )}
        </div>
      </Card>
    </div>
  )
}


