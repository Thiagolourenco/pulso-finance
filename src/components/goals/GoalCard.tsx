import { useState, useEffect, useRef } from 'react'
import type { Goal } from '@/types'

interface GoalCardProps {
  goal: Goal
  onUpdate?: () => void
}

export const GoalCard = ({ goal }: GoalCardProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [showFireworks, setShowFireworks] = useState(false)
  const wasCompletedRef = useRef(false)
  const previousProgressRef = useRef(0)

  const progress = goal.target_amount > 0 
    ? Math.min(((goal.current_amount || 0) / goal.target_amount) * 100, 100)
    : 0
  
  const remaining = Math.max(0, goal.target_amount - (goal.current_amount || 0))
  const isCompleted = (goal.current_amount || 0) >= goal.target_amount

  // Anima o progresso suavemente
  useEffect(() => {
    const startProgress = previousProgressRef.current
    const targetProgress = progress
    const duration = 800 // 0.8 segundos
    const steps = 40
    const increment = (targetProgress - startProgress) / steps
    let current = startProgress
    let step = 0

    const timer = setInterval(() => {
      step++
      current = startProgress + (increment * step)
      setAnimatedProgress(Math.min(Math.max(current, 0), 100))
      
      if (step >= steps) {
        clearInterval(timer)
        previousProgressRef.current = targetProgress
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [progress])

  // Detecta quando a meta é completada e mostra fogos
  useEffect(() => {
    if (isCompleted && !wasCompletedRef.current && progress >= 100) {
      wasCompletedRef.current = true
      setShowFireworks(true)
      setTimeout(() => setShowFireworks(false), 3000)
    } else if (!isCompleted) {
      wasCompletedRef.current = false
    }
  }, [isCompleted, progress])

  // Calcula dias restantes
  let daysRemaining: number | null = null
  let monthlyNeeded: number | null = null
  if (goal.target_date && !isCompleted) {
    const targetDate = new Date(goal.target_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    targetDate.setHours(0, 0, 0, 0)
    const diffTime = targetDate.getTime() - today.getTime()
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (daysRemaining > 0) {
      const monthsRemaining = daysRemaining / 30
      monthlyNeeded = monthsRemaining > 0 ? remaining / monthsRemaining : null
    }
  }

  return (
    <div className="relative">
      {/* Animação de fogos de artifício */}
      {showFireworks && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <FireworksAnimation />
        </div>
      )}

      <div
        className="p-5 bg-white rounded-card-lg border-2 border-border hover:border-primary-400 hover:shadow-lg transition-all duration-fast relative overflow-hidden"
      >
        {/* Badge de concluída */}
        {isCompleted && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-3 py-1 bg-success-100 text-success-700 text-caption font-semibold rounded-full flex items-center gap-1">
              <span className="text-sm">🎉</span>
              Concluída!
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-body font-semibold text-neutral-900 pr-20">{goal.name}</h3>
        </div>
        
        {/* Barra de progresso animada */}
        <div className="mb-4">
          <div className="flex justify-between text-caption text-neutral-600 mb-2">
            <span>Progresso</span>
            <span className="font-semibold">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-1000 ease-out ${
                isCompleted ? 'bg-success-500' : 'bg-primary-500'
              }`}
              style={{ 
                width: `${animatedProgress}%`,
                boxShadow: isCompleted ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none'
              }}
            />
            {/* Efeito de brilho quando completa */}
            {isCompleted && (
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"
                style={{ animation: 'shimmer 2s infinite' }}
              />
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-body-sm">
            <span className="text-neutral-600">Atual:</span>
            <span className="font-medium text-neutral-900">
              R$ {(goal.current_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-neutral-600">Meta:</span>
            <span className="font-medium text-neutral-900">
              R$ {goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {!isCompleted && (
            <div className="flex justify-between text-body-sm">
              <span className="text-neutral-600">Falta:</span>
              <span className="font-semibold text-warning-600">
                R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {goal.target_date && !isCompleted && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between text-caption">
              <span className="text-neutral-500">Prazo:</span>
              <span className="font-medium text-neutral-700">
                {new Date(goal.target_date).toLocaleDateString('pt-BR')}
              </span>
            </div>
            {daysRemaining !== null && daysRemaining > 0 && (
              <div className="flex items-center justify-between text-caption mt-1">
                <span className="text-neutral-500">Restam:</span>
                <span className="font-medium text-neutral-700">
                  {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                </span>
              </div>
            )}
            {monthlyNeeded !== null && monthlyNeeded > 0 && (
              <div className="mt-2 p-2 bg-primary-50 rounded-lg">
                <p className="text-caption text-primary-700">
                  <span className="font-semibold">R$ {monthlyNeeded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  {' '}por mês para alcançar
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente de animação de fogos de artifício
const FireworksAnimation = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF6B9D', '#C44569', '#95E1D3', '#F38181', '#AA96DA', '#FFD93D', '#6BCB77']
  
  // Cria múltiplas explosões de fogos
  const explosions = Array.from({ length: 5 }, (_, explosionIndex) => {
    const centerX = 20 + (explosionIndex * 20) // Distribui as explosões
    const centerY = 30 + (explosionIndex % 2) * 40
    
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 12
      const distance = 80 + Math.random() * 60
      const x = Math.cos(angle) * distance
      const y = Math.sin(angle) * distance
      const color = colors[Math.floor(Math.random() * colors.length)]
      const delay = explosionIndex * 0.2 + Math.random() * 0.2
      
      return {
        id: `${explosionIndex}-${i}`,
        x: centerX,
        y: centerY,
        offsetX: x,
        offsetY: y,
        color,
        delay,
      }
    })
  }).flat()
  
  return (
    <>
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        {explosions.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-3 h-3 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              boxShadow: `0 0 8px ${particle.color}, 0 0 16px ${particle.color}`,
              animation: `firework-explode 2s ease-out ${particle.delay}s forwards`,
              '--offset-x': `${particle.offsetX}px`,
              '--offset-y': `${particle.offsetY}px`,
            } as React.CSSProperties & { '--offset-x': string; '--offset-y': string }}
          />
        ))}
      </div>
      <style>{`
        @keyframes firework-explode {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0);
            opacity: 1;
          }
          30% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(var(--offset-x), var(--offset-y)) scale(1);
          }
          100% {
            transform: translate(-50%, -50%) translate(calc(var(--offset-x) * 1.5), calc(var(--offset-y) * 1.5)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}

