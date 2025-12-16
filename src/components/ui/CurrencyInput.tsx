import { forwardRef, useState, useEffect } from 'react'
import { Input } from './Input'
import type { InputProps } from './Input'

export interface CurrencyInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  value?: number
  onChange?: (value: number) => void
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('')

    useEffect(() => {
      if (value !== undefined && value !== null) {
        // Formata o valor para exibição
        const formatted = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value)
        setDisplayValue(formatted)
      } else {
        setDisplayValue('')
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      
      // Remove tudo exceto números
      const numbersOnly = inputValue.replace(/\D/g, '')
      
      if (numbersOnly === '') {
        setDisplayValue('')
        onChange?.(0)
        return
      }

      // Converte para número (centavos)
      const cents = parseInt(numbersOnly, 10)
      const realValue = cents / 100

      // Formata para exibição
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(realValue)

      setDisplayValue(formatted)
      onChange?.(realValue)
    }

    const handleBlur = () => {
      // Garante que o valor está formatado corretamente ao perder o foco
      if (value !== undefined && value !== null) {
        const formatted = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value)
        setDisplayValue(formatted)
      }
    }

    return (
      <Input
        ref={ref}
        {...props}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="R$ 0,00"
      />
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

