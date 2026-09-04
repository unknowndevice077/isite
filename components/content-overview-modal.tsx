'use client'

import { Button } from '@/components/ui/button'
import { Scroll, ArrowRight, SkipForward } from 'lucide-react'
import type { WorldMap } from '@/lib/types'
import { playClick } from '@/lib/sfx'

interface ContentOverviewModalProps {
  worldMap: WorldMap
  onDismiss: () => void
}

export function ContentOverviewModal({ worldMap, onDismiss }: ContentOverviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto parchment-texture rounded-lg animate-border-glow">
        <div className="flex items-start justify-between p-6 pb-4 border-b border-[var(--gold-dim)]/30">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 shrink-0 rounded-lg stone-texture flex items-center justify-center">
              <Scroll className="h-5 w-5 text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--gold-dim)] uppercase tracking-wider font-sans">What You're About to Learn</p>
              <h2 className="font-serif text-xl text-[var(--gold)] font-bold leading-tight">{worldMap.title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { playClick(); onDismiss() }}
            className="shrink-0 flex items-center gap-1 text-xs text-[var(--parchment-dark)] hover:text-[var(--gold)] transition-colors uppercase tracking-wider font-semibold"
          >
            Skip <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {worldMap.synopsis && (
            <p className="text-[var(--parchment)] text-sm leading-relaxed">{worldMap.synopsis}</p>
          )}

          <div>
            <p className="text-[10px] text-[var(--gold-dim)] uppercase tracking-widest font-black mb-2">
              {worldMap.concepts.length} Topic{worldMap.concepts.length === 1 ? '' : 's'} Covered
            </p>
            <div className="flex flex-wrap gap-2">
              {worldMap.concepts.map((c) => (
                <span
                  key={c.id}
                  className="px-3 py-1.5 rounded-full bg-black/30 border border-[var(--gold-dim)]/30 text-[var(--parchment)] text-xs font-serif"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          <Button
            onClick={() => { playClick(); onDismiss() }}
            className="w-full h-14 text-lg font-serif font-semibold gap-3 bg-[var(--gold)] hover:bg-[var(--gold-dim)] text-black gold-glow"
          >
            Begin the Adventure <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
