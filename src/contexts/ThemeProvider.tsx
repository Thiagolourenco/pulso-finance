import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  // Fallback seguro: evita crash caso o provider não esteja montado por algum motivo
  // (ex: erro de localStorage, render parcial, etc.)
  if (context) return context
  return {
    theme: (document.documentElement.classList.contains('dark') ? 'dark' : 'light') as Theme,
    toggleTheme: () => {
      const root = document.documentElement
      const next = root.classList.contains('dark') ? 'light' : 'dark'
      if (next === 'dark') root.classList.add('dark')
      else root.classList.remove('dark')
      try {
        localStorage.setItem('theme', next)
      } catch {
        // ignore
      }
    },
  }
}

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      // Verifica se há preferência salva
      const savedTheme = localStorage.getItem('theme') as Theme | null
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    } catch {
      // ignore
    }

    // Default: dark (baseado no design)
    return 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

