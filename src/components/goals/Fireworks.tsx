import { useEffect, useState } from 'react'

interface FireworksProps {
  show: boolean
  onComplete?: () => void
}

export const Fireworks = ({ show, onComplete }: FireworksProps) => {
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    y: number
    color: string
    delay: number
    translateX: number
    translateY: number
    translateX2: number
    translateY2: number
  }>>([])

  useEffect(() => {
    if (show) {
      // Cria partículas de fogos de artifício com valores aleatórios calculados uma vez
      const newParticles = Array.from({ length: 50 }, (_, i) => {
        // Calcula todos os valores aleatórios uma vez durante a criação
        const translateX1 = Math.random() * 200 - 100
        const translateY1 = Math.random() * 200 - 100
        const translateX2 = Math.random() * 400 - 200
        const translateY2 = Math.random() * 400 - 200
        
        return {
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF6B9D', '#C44569', '#95E1D3', '#F38181', '#AA96DA'][
            Math.floor(Math.random() * 8)
          ],
          delay: Math.random() * 0.5,
          translateX: translateX1,
          translateY: translateY1,
          translateX2: translateX2,
          translateY2: translateY2,
        }
      })
      setTimeout(() => {
        setParticles(newParticles)
      }, 0)

      // Chama onComplete após a animação
      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setTimeout(() => {
        setParticles([])
      }, 0)
    }
  }, [show, onComplete])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animation: `firework-explode-${particle.id} ${1.5 + particle.delay}s ease-out ${particle.delay}s forwards`,
            boxShadow: `0 0 10px ${particle.color}, 0 0 20px ${particle.color}`,
          }}
        />
      ))}
      <style>{`
        ${particles.map((particle) => `
          @keyframes firework-explode-${particle.id} {
            0% {
              transform: translate(0, 0) scale(0);
              opacity: 1;
            }
            50% {
              opacity: 1;
              transform: translate(
                ${particle.translateX}px,
                ${particle.translateY}px
              ) scale(1);
            }
            100% {
              transform: translate(
                ${particle.translateX2}px,
                ${particle.translateY2}px
              ) scale(0);
              opacity: 0;
            }
          }
        `).join('')}
      `}</style>
    </div>
  )
}


