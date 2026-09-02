'use client'

import { CheckCircle2, Lock, Swords, XCircle, Star } from 'lucide-react'
import type { Concept } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ScholarSprite } from '@/components/sprites'

interface QuestRoadmapProps {
  concepts: Array<Concept & { locked: boolean }>
  onSelectConcept: (concept: Concept) => void
}

const NODE_SIZE = 84
const ROW_HEIGHT = 150
// Horizontal position (in %) for each node along the trail, cycling through a
// gentle zigzag so it reads as a winding path rather than a straight column.
const X_PATTERN = [50, 74, 88, 74, 50, 26, 12, 26]

function xFor(index: number) {
  return X_PATTERN[index % X_PATTERN.length]
}

export function QuestRoadmap({ concepts, onSelectConcept }: QuestRoadmapProps) {
  const height = Math.max(1, concepts.length) * ROW_HEIGHT + NODE_SIZE
  // Index of the first non-completed, non-locked node — where the Scholar sprite stands.
  const currentIndex = concepts.findIndex((c) => !c.completed && !c.locked)

  const points = concepts.map((_, i) => ({
    x: xFor(i),
    y: NODE_SIZE / 2 + i * ROW_HEIGHT,
  }))

  const pathD = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const prev = points[i - 1]
      const midY = (prev.y + p.y) / 2
      return `C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`
    })
    .join(' ')

  return (
    <div className="relative w-full mx-auto max-w-xl" style={{ height }}>
      {/* Trail path */}
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <path
          d={pathD}
          fill="none"
          stroke="var(--gold-dim)"
          strokeOpacity={0.35}
          strokeWidth={1.2}
          strokeDasharray="2 3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {concepts.map((concept, index) => {
        const pos = points[index]
        const isCompleted = concept.completed
        const isLocked = concept.locked
        const isFailed = (concept as { failed?: boolean }).failed || false
        const isCurrent = index === currentIndex

        return (
          <div
            key={concept.id}
            className="absolute -translate-x-1/2"
            style={{ left: `${pos.x}%`, top: pos.y - NODE_SIZE / 2, width: NODE_SIZE }}
          >
            {isCurrent && (
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 w-9 h-9 animate-float drop-shadow-[0_0_10px_rgba(255,215,0,0.6)]">
                <ScholarSprite className="w-full h-full" />
              </div>
            )}

            <button
              type="button"
              onClick={() => !isLocked && onSelectConcept(concept)}
              disabled={isLocked}
              className={cn(
                'relative flex items-center justify-center rounded-full border-4 transition-all duration-300',
                'shadow-lg mx-auto',
                isLocked
                  ? 'bg-zinc-900 border-zinc-800 cursor-not-allowed opacity-60'
                  : isCompleted
                    ? 'bg-green-950 border-green-500/70 hover:scale-110 hover:border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.35)]'
                    : isFailed
                      ? 'bg-red-950 border-red-500/70 hover:scale-110 hover:border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                      : cn(
                          'bg-black border-[var(--gold-dim)] hover:scale-110 hover:border-[var(--gold)]',
                          'shadow-[0_0_20px_rgba(255,215,0,0.3)]',
                          isCurrent && 'animate-glow-pulse',
                        ),
              )}
              style={{ width: NODE_SIZE, height: NODE_SIZE }}
              title={concept.name}
            >
              {isLocked ? (
                <Lock className="h-7 w-7 text-zinc-600" />
              ) : isCompleted ? (
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              ) : isFailed ? (
                <XCircle className="h-8 w-8 text-red-400" />
              ) : (
                <Swords className="h-8 w-8 text-[var(--gold)]" />
              )}

              <span
                className={cn(
                  'absolute -top-2 -left-2 flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-black border-2',
                  isLocked
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    : isCompleted
                      ? 'bg-green-500 border-green-300 text-black'
                      : isFailed
                        ? 'bg-red-500 border-red-300 text-black'
                        : 'bg-[var(--gold)] border-yellow-200 text-black',
                )}
              >
                {index + 1}
              </span>
            </button>

            <div className="mt-2 text-center">
              <p
                className={cn(
                  'text-xs font-serif font-bold leading-tight truncate',
                  isLocked ? 'text-zinc-700' : isCompleted ? 'text-green-400' : isFailed ? 'text-red-400' : 'text-[var(--gold)]',
                )}
              >
                {concept.location}
              </p>
              {!isLocked && (
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <Star className="h-2.5 w-2.5 fill-[var(--gold-dim)] text-[var(--gold-dim)]" />
                  <span className="text-[10px] text-[var(--parchment-dark)] font-mono">{concept.xpReward} XP</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
