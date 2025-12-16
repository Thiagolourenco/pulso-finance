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
  }>>([])

  useEffect(() => {
    if (show) {
      // Cria partículas de fogos de artifício
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF6B9D', '#C44569', '#95E1D3', '#F38181', '#AA96DA'][
          Math.floor(Math.random() * 8)
        ],
        delay: Math.random() * 0.5,
      }))
      setParticles(newParticles)

      // Chama onComplete após a animação
      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setParticles([])
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
            animation: `firework-explode ${1.5 + Math.random()}s ease-out ${particle.delay}s forwards`,
            boxShadow: `0 0 10px ${particle.color}, 0 0 20px ${particle.color}`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes firework-explode {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
            transform: translate(
              ${Math.random() * 200 - 100}px,
              ${Math.random() * 200 - 100}px
            ) scale(1);
          }
          100% {
            transform: translate(
              ${Math.random() * 400 - 200}px,
              ${Math.random() * 400 - 200}px
            ) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}


