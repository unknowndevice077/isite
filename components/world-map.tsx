'use client'

import { ConceptCard } from './concept-card'
import { Swords, Star, Trophy, Shield, Scroll, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Concept } from '@/lib/types'
import { getLevel, getLevelTitle } from '@/lib/xp'

interface WorldMapProps {
  title?: string
  concepts: Concept[]
  onSelectConcept: (concept: Concept) => void
  onBack: () => void
}

export function WorldMap({ title, concepts, onSelectConcept, onBack }: WorldMapProps) {
  // --- LOGIC ---
  const conceptsWithLocks = concepts.map((concept, index) => ({
    ...concept,
    locked: index > 0 && !concepts[index - 1].completed
  }))

  const completedCount = conceptsWithLocks.filter(c => c.completed).length
  const totalXp = conceptsWithLocks.reduce((sum, c) => sum + (c.completed ? c.xpReward : 0), 0)
  
  // Using your existing level logic
  const level = getLevel(totalXp)
  const levelTitle = getLevelTitle(level)
  const potentialXp = conceptsWithLocks.reduce((sum, c) => sum + c.xpReward, 0)

  const handleSelectConcept = (concept: Concept) => {
    if (!concept.locked) {
      onSelectConcept(concept)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Row */}
      {title && (
        <div className="px-2">
          <h2 className="text-3xl font-black font-serif text-[var(--gold)] uppercase tracking-tighter drop-shadow-sm">
            {title}
          </h2>
        </div>
      )}

      {/* Hero Stats Bar with Integrated Back Button */}
      <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl parchment-texture border-2 border-[var(--gold-dim)]/30 shadow-2xl animate-border-glow">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          
          {/* Scroll on Left | Rank Text on Right */}
          <div className="flex items-center gap-4">
            <Scroll className="h-14 w-14 text-[var(--gold)] drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]" />
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-[var(--gold-dim)] uppercase font-black leading-none tracking-widest mb-1.5">
                Current Rank
              </span>
              <span className="text-2xl font-serif font-black text-[var(--gold)] uppercase tracking-tight leading-none">
                {levelTitle}
              </span>
            </div>
          </div>

          <div className="hidden lg:block w-px h-12 bg-[var(--gold-dim)]/20" />
          
          {/* XP Progress Section */}
          <div className="space-y-1">
            <p className="text-[10px] text-[var(--gold-dim)] uppercase tracking-[0.2em] font-black">
              Total Wisdom Gained
            </p>
            <h2 className="text-3xl font-serif font-black text-[var(--gold)] tracking-tighter">
              {totalXp.toLocaleString()} <span className="text-sm font-normal text-[var(--parchment-dark)]">/ {potentialXp} XP</span>
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-48 bg-black/40 rounded-full overflow-hidden border border-[var(--gold-dim)]/20 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-[var(--gold-dim)] to-[var(--gold)] shadow-[0_0_8px_rgba(255,215,0,0.5)] transition-all duration-1000" 
                  style={{ width: `${(totalXp / potentialXp) * 100}%` }} 
                />
              </div>
              <Star className="h-3 w-3 text-[var(--gold)] fill-[var(--gold)]" />
            </div>
          </div>
        </div>

        {/* Action Row: Back Button & Victory Status */}
        <div className="flex flex-col items-end gap-3 mt-6 md:mt-0">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="border-[var(--gold-dim)]/50 text-[var(--gold)] hover:bg-[var(--gold)]/10 font-serif px-6 py-5 gap-2 uppercase font-black tracking-widest text-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          {completedCount === conceptsWithLocks.length && conceptsWithLocks.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/50 animate-pulse">
              <Trophy className="h-5 w-5 text-[var(--success)]" />
              <span className="text-[10px] font-black text-[var(--success)] uppercase tracking-widest">Region Mastered</span>
            </div>
          )}
        </div>
      </div>

      {/* Concept grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {conceptsWithLocks.map((concept, index) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            index={index}
            onClick={() => handleSelectConcept(concept)}
          />
        ))}
      </div>
    </div>
  )
}