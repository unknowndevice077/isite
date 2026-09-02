'use client'

import { Button } from '@/components/ui/button'
import { Map, MessageSquare, Heart, FlaskConical, ShieldCheck, Sparkles } from 'lucide-react'
import { ScholarSprite, SageSprite } from '@/components/sprites'

interface TutorialModalProps {
  onDismiss: () => void
}

const STEPS = [
  {
    icon: Map,
    title: 'Walk the Trail',
    body: 'Your study material becomes a chain of quest nodes. Complete one to unlock the next.',
  },
  {
    icon: MessageSquare,
    title: 'Face the Dungeon Master',
    body: 'The Sage will quiz you on each concept in plain conversation — answer in your own words.',
  },
  {
    icon: Heart,
    title: 'Mind Your HP',
    body: 'Wrong or shaky answers cost health. Run out and the trial is lost — but you can always retry.',
  },
  {
    icon: FlaskConical,
    title: 'Use Your Items',
    body: 'Hint Potions (3) nudge you toward the answer. A Health Shield (1) restores HP once per trial.',
  },
  {
    icon: Sparkles,
    title: 'Earn XP, Ascend',
    body: 'Reach 100 XP in a trial to master it and move on. Complete every node to conquer the realm.',
  },
]

export function TutorialModal({ onDismiss }: TutorialModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto parchment-texture rounded-lg animate-border-glow">
        <div className="p-8 text-center border-b border-[var(--gold-dim)]/30">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-14 w-14 p-2 rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold-dim)]">
              <ScholarSprite className="w-full h-full" />
            </div>
            <div className="h-14 w-14 p-2 rounded-full bg-[var(--gold)]/10 border-2 border-[var(--gold-dim)]">
              <SageSprite className="w-full h-full" />
            </div>
          </div>
          <h2 className="font-serif text-2xl text-[var(--gold)] font-black uppercase tracking-tight">
            Before You Set Out
          </h2>
          <p className="text-[var(--parchment-dark)] text-sm mt-1">A quick word on how this realm works</p>
        </div>

        <div className="p-6 space-y-4">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={idx} className="flex items-start gap-4">
                <div className="shrink-0 h-10 w-10 rounded-lg stone-texture flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[var(--gold)]" />
                </div>
                <div>
                  <p className="font-serif font-bold text-[var(--gold)] text-sm uppercase tracking-wide">{step.title}</p>
                  <p className="text-[var(--parchment-dark)] text-sm leading-snug mt-0.5">{step.body}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="p-6 pt-0">
          <Button
            onClick={onDismiss}
            className="w-full h-14 text-lg font-serif font-semibold gap-3 bg-[var(--gold)] hover:bg-[var(--gold-dim)] text-black gold-glow"
          >
            <ShieldCheck className="h-5 w-5" />
            Begin the Adventure
          </Button>
        </div>
      </div>
    </div>
  )
}
