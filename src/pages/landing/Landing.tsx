import heroIllustration from '@/assets/illus.svg'
import { logAnalyticsEvent } from '@/lib/firebase/analytics'

const features = [
  {
    title: 'Orçamento por categoria',
    desc: 'Limites mensais, alertas inteligentes e visão clara de onde o dinheiro vai.',
    icon: '📊',
  },
  {
    title: 'Cartões e faturas no controle',
    desc: 'Compras parceladas, faturas abertas e vencimentos sem surpresas.',
    icon: '💳',
  },
  {
    title: 'Metas e sobras',
    desc: 'Defina objetivos, acompanhe o progresso e veja a sobra do mês em tempo real.',
    icon: '🎯',
  },
  {
    title: 'Alertas críticos',
    desc: 'Avisos automáticos quando um limite está perto de estourar.',
    icon: '⚡',
  },
]

const stats = [
  { value: '89%', label: 'redução de imprevistos no 1º mês' },
  { value: '3x', label: 'mais clareza sobre para onde vai o dinheiro' },
  { value: '15min', label: 'para configurar e começar a usar' },
]

const faqs = [
  {
    q: 'Preciso conectar meu banco?',
    a: 'Não obrigatoriamente. Você pode começar registrando transações e cartões manualmente e, se quiser, integrar depois.',
  },
  {
    q: 'Posso controlar faturas e parcelas?',
    a: 'Sim. Compras parceladas, faturas abertas e vencimentos ficam centralizados no dashboard.',
  },
  {
    q: 'E se eu quiser mudar limites?',
    a: 'Limites por categoria podem ser ajustados a qualquer momento — inclusive direto do dashboard.',
  },
]

export const Landing = () => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulseGlow {
          0% { opacity: 0.35; }
          50% { opacity: 0.6; }
          100% { opacity: 0.35; }
        }
      `}</style>
      {/* Navbar simples */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={heroIllustration} alt="Pulso" className="h-10 w-10 rounded-lg border border-neutral-800" />
          <span className="text-lg font-semibold tracking-tight">Pulso</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <a href="#features" className="hover:text-primary-300 transition-colors">Recursos</a>
          <a href="#pricing" className="hover:text-primary-300 transition-colors">Planos</a>
          <a href="#faq" className="hover:text-primary-300 transition-colors">FAQ</a>
          <a href="/login" className="px-3 py-1.5 rounded-lg bg-primary-500 text-neutral-950 font-semibold hover:bg-primary-400 transition-colors">
            Entrar
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-300 text-xs font-semibold">
            Nova versão • Orçamentos por categoria + alertas
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Controle seus gastos por categoria com alertas inteligentes.
          </h1>
          <p className="text-neutral-300 text-lg leading-relaxed">
            Pulso é o cockpit das suas finanças: limites mensais por categoria, cartões e faturas em um só lugar,
            metas claras e avisos quando algo foge do planejado.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/register"
              className="px-5 py-3 rounded-lg bg-primary-500 text-neutral-950 font-semibold hover:bg-primary-400 transition-colors"
              onClick={() => {
                void logAnalyticsEvent('cta_click', { position: 'hero_primary', label: 'Criar conta grátis' })
              }}
            >
              Criar conta grátis
            </a>
            <a
              href="#features"
              className="px-5 py-3 rounded-lg border border-neutral-700 hover:border-primary-400 transition-colors"
              onClick={() => {
                void logAnalyticsEvent('cta_click', { position: 'hero_secondary', label: 'Ver recursos' })
              }}
            >
              Ver recursos
            </a>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-neutral-300">
            <span>⚡ Alertas de limite</span>
            <span>🧾 Faturas e parcelas</span>
            <span>🎯 Metas e sobras</span>
          </div>
        </div>
        <div className="relative" style={{ animation: 'float 6s ease-in-out infinite' }}>
          <div className="absolute -inset-6 rounded-3xl bg-primary-500/10 blur-3xl" style={{ animation: 'pulseGlow 6s ease-in-out infinite' }} />
          <div className="relative rounded-3xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-2xl">
            <img src={heroIllustration} alt="Dashboard preview" className="w-full rounded-2xl border border-neutral-800" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
            <div className="text-3xl font-bold text-primary-300">{s.value}</div>
            <div className="text-neutral-300 mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-14 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Por que o Pulso ajuda?</h2>
          <span className="text-sm text-neutral-400">Limites, alertas e visibilidade em um só lugar.</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-2">
              <div className="text-2xl">{f.icon}</div>
              <div className="text-lg font-semibold">{f.title}</div>
              <p className="text-neutral-300 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing (simples) */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-14 space-y-6">
        <h2 className="text-3xl font-bold">Planos simples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 space-y-3">
            <p className="text-sm text-neutral-400">Início</p>
            <p className="text-3xl font-bold">R$ 0 <span className="text-base text-neutral-400">/mês</span></p>
            <ul className="text-sm text-neutral-300 space-y-1">
              <li>• Orçamento por categoria</li>
              <li>• Cadastro de cartões e faturas</li>
              <li>• Metas básicas</li>
            </ul>
            <a
              href="/register"
              className="inline-block mt-2 px-4 py-2 rounded-lg bg-primary-500 text-neutral-950 font-semibold hover:bg-primary-400"
              onClick={() => void logAnalyticsEvent('cta_click', { position: 'pricing_free', plan: 'free' })}
            >
              Começar grátis
            </a>
          </div>
          <div className="rounded-2xl border border-primary-500/50 bg-primary-500/10 p-6 space-y-3">
            <p className="text-sm text-primary-200">Pro</p>
            <p className="text-3xl font-bold">R$ 9,90 <span className="text-base text-neutral-200">/mês</span></p>
            <p className="text-sm text-primary-200">ou R$ 99 /ano (economize)</p>
            <ul className="text-sm text-neutral-100 space-y-1">
              <li>• Alertas inteligentes</li>
              <li>• Prioridade nas faturas e parcelas</li>
              <li>• Metas avançadas e sobras</li>
              <li>• Suporte prioritário</li>
            </ul>
            <a
              href="/register"
              className="inline-block mt-2 px-4 py-2 rounded-lg bg-primary-500 text-neutral-950 font-semibold hover:bg-primary-400"
              onClick={() => void logAnalyticsEvent('cta_click', { position: 'pricing_pro', plan: 'pro' })}
            >
              Testar o Pro
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-6xl mx-auto px-6 py-14 space-y-6">
        <h2 className="text-3xl font-bold">Perguntas frequentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((item) => (
            <div key={item.q} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
              <p className="font-semibold text-neutral-50">{item.q}</p>
              <p className="text-neutral-300 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="rounded-3xl border border-primary-500/30 bg-primary-500/10 p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-neutral-50">Pronto para ter clareza total do seu dinheiro?</h3>
            <p className="text-neutral-200 mt-1">Comece grátis e ative alertas, orçamentos por categoria e metas em minutos.</p>
          </div>
          <a
            href="/register"
            className="px-5 py-3 rounded-lg bg-primary-500 text-neutral-950 font-semibold hover:bg-primary-400 transition-colors"
            onClick={() => void logAnalyticsEvent('cta_click', { position: 'cta_final', label: 'Criar conta agora' })}
          >
            Criar conta agora
          </a>
        </div>
      </section>

      <footer className="border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-neutral-400">
          <div className="flex items-center gap-2">
            <img src={heroIllustration} alt="Pulso" className="h-6 w-6" />
            <span>Pulso • Controle e clareza financeira</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login" className="hover:text-primary-300">Entrar</a>
            <a href="/register" className="hover:text-primary-300">Criar conta</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing


