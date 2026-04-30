import { InputForm } from '@/components/input-form'
import { RecentAdventures } from '@/components/recent-adventures'
import { XpBar } from '@/components/xp-bar'
import { BookOpen, Swords, Crown, Scroll, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[var(--gold)]/5 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold-dim)] mb-8 shadow-[0_0_40px_rgba(255,215,0,0.2)]">
              <Scroll className="h-10 w-10 text-[var(--gold)]" />
            </div>
            <h1 className="font-serif text-6xl sm:text-7xl font-black mb-6 tracking-tight">
              <span className="text-[var(--gold)] drop-shadow-[0_4px_12px_rgba(255,215,0,0.3)] uppercase">Quest</span>{' '}
              <span className="text-[var(--parchment)] uppercase">Scribe</span>
            </h1>
            <p className="text-xl text-[var(--parchment-dark)] max-w-2xl mx-auto leading-relaxed font-serif italic">
              "Transform thy sacred scrolls of knowledge into a legendary gauntlet of trials."
            </p>
          </div>

          {/* Player Progress Dashboard */}
          <div className="mb-12">
            <XpBar />
          </div>

          {/* How it works - Placed at the top */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: BookOpen, title: "1. Inscribe", desc: "Paste thy sacred text" },
              { icon: Swords, title: "2. Challenge", desc: "Face the Master's trials" },
              { icon: Crown, title: "3. Ascend", desc: "Claim thy eternal XP" }
            ].map((step, i) => (
              <div key={i} className="p-6 rounded-xl parchment-texture border-2 border-[var(--gold-dim)]/20 text-center shadow-lg">
                <step.icon className="h-8 w-8 text-[var(--gold)] mx-auto mb-3" />
                <h3 className="font-serif font-black text-[var(--gold)] uppercase text-xs tracking-widest">{step.title}</h3>
                <p className="text-[11px] text-[var(--parchment-dark)] font-black uppercase mt-1 opacity-70">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Main Questing Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            <div className="lg:col-span-3">
              <InputForm />
            </div>

            <aside className="lg:col-span-1 h-full">
              <RecentAdventures />
            </aside>
          </div>
        </div>
      </div>
    </main>
  )
}