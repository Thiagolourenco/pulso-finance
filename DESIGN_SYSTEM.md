# Design System - Pulso

Este documento descreve o design system implementado conforme a documentação visual.

## Paleta de Cores

### Cores Semânticas

- **Primária (Azul escuro)**: `primary-800` (#1E293B) - Confiança, estabilidade, foco
- **Sucesso (Verde)**: `success-600` (#16A34A) - Receita, saldo positivo, progresso
- **Alerta (Amarelo/Laranja)**: `warning-500` (#F59E0B) / `alert-500` (#F97316) - Atenção, orçamento perto do limite
- **Perigo (Vermelho)**: `danger-600` (#DC2626) - Gasto, dívida, limite estourado
- **Neutros**: Fundo `neutral-50`, Texto principal `neutral-900`, Texto secundário `neutral-500`

## Tipografia

- **Fonte**: Inter (Google Fonts)
- **Hierarquia**:
  - Display: 40px, bold
  - H1: 32px, bold
  - H2: 24px, semibold
  - H3: 20px, semibold
  - Body: 16px
  - Body Small: 14px
  - Label: 14px, medium
  - Caption: 12px

## Componentes UI

### Button
- Variantes: `primary`, `secondary`, `danger`, `ghost`
- Tamanhos: `sm`, `md`, `lg`
- Estados: default, hover, active, disabled, loading
- Animações: scale no active, transições suaves

### Card
- Variantes: `default`, `outlined`, `elevated`
- Border radius: 12px
- Sombras sutis com hover

### Input
- Suporte a label, error, helperText
- Estados de foco com ring
- Animações de shake em erro

### CurrencyInput
- Máscara automática para valores monetários (BRL)
- Formatação em tempo real
- Placeholder: "R$ 0,00"

### FinancialCard
- Card especializado para valores financeiros
- Suporte a ícones, subtítulos e trends
- Variantes de cor semântica

### EmptyState
- Estados vazios com ícones, título, descrição e CTA
- Animações de fade-in

### Loading
- LoadingSpinner: spinner animado
- Skeleton: placeholder de carregamento
- CardSkeleton: skeleton para cards

## Animações

### Microinterações
- **Fade In/Out**: 150ms ease-out
- **Slide In/Out**: 200ms ease-out com translateY
- **Scale In**: 150ms ease-out
- **Shake**: 0.5s para feedback de erro
- **Pulse Subtle**: 2s para destaque sutil

### Transições
- Duração padrão: 150-250ms
- Easing: ease-out (cubic-bezier)
- Nunca usar: bounce, elastic, animações longas

## Layout

### Grid
- 12 colunas no desktop
- Cards com largura fixa
- Padding generoso (16-24px)

### Sidebar
- Fixa à esquerda
- 256px de largura
- Navegação com estados ativos
- Scroll customizado

## Estados Visuais

Todos os componentes suportam:
- Default
- Hover
- Active (com scale)
- Disabled
- Loading (skeleton)
- Empty state
- Error

## Acessibilidade

- Contraste AA mínimo
- Focus states visíveis (ring-2)
- Texto nunca só por cor
- Suporte a navegação por teclado

## Uso

```tsx
import { Button, Card, Input, FinancialCard } from '@/components/ui'

// Exemplo de uso
<FinancialCard
  title="Receitas do mês"
  value={5000}
  variant="success"
  trend={{ value: '+12%', isPositive: true }}
/>
```





