'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  MapPin, 
  Star, 
  Swords, 
  Lock, 
  XCircle 
} from 'lucide-react'
import type { Concept } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ConceptCardProps {
  concept: Concept
  onClick: () => void
  index: number
}

const difficultyConfig = {
  easy: {
    label: 'Novice',
    stars: 1,
  },
  medium: {
    label: 'Adept',
    stars: 2,
  },
  hard: {
    label: 'Master',
    stars: 3,
  },
}

export function ConceptCard({ concept, onClick, index }: ConceptCardProps) {
  const config = difficultyConfig[concept.difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium
  const isCompleted = concept.completed
  const isLocked = concept.locked
  // Assumes your concept data tracks a failed state
  const isFailed = (concept as any).failed || false 
  
  const progressPercent = isCompleted ? 100 : 0;

  const handleClick = () => {
    if (!isLocked) {
      onClick()
    }
  }

  return (
    <Card 
      className={cn(
        'group relative cursor-pointer transition-all duration-300 overflow-hidden',
        'border-2 hover:scale-[1.02]',
        isLocked
          ? 'bg-zinc-900/50 border-zinc-800 hover:scale-100 cursor-not-allowed opacity-60'
          : isCompleted 
            ? 'bg-green-950/40 border-green-500/50 hover:border-green-400' 
            : isFailed
              ? 'bg-red-950/40 border-red-500/50 hover:border-red-400'
              : 'bg-black border-[var(--gold-dim)]/40 hover:border-[var(--gold)]'
      )}
      onClick={handleClick}
    >
      {/* Background Glow */}
      {!isLocked && (
        <div className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
          isCompleted 
            ? 'bg-gradient-to-br from-green-500/10 to-transparent'
            : isFailed
              ? 'bg-gradient-to-br from-red-500/10 to-transparent'
              : 'bg-gradient-to-br from-[var(--gold)]/10 to-transparent'
        )} />
      )}
      
      {/* Indicators */}
      <div className="absolute top-3 right-3 z-10">
        {isCompleted && (
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-green-500/20 border-2 border-green-500/60 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          </div>
        )}
        {isFailed && (
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-red-500/20 border-2 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
            <XCircle className="h-5 w-5 text-red-400" />
          </div>
        )}
        {isLocked && (
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-zinc-800/50 border-2 border-zinc-700">
            <Lock className="h-5 w-5 text-zinc-500" />
          </div>
        )}
      </div>

      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className={cn(
            'flex items-center justify-center h-10 w-10 rounded-lg flex-shrink-0',
            isLocked
              ? 'bg-zinc-800 border border-zinc-700'
              : isCompleted 
                ? 'bg-green-500/20 border border-green-500/40' 
                : isFailed
                  ? 'bg-red-500/20 border border-red-500/40'
                  : 'bg-[var(--gold)]/10 border border-[var(--gold-dim)]/50'
          )}>
            <MapPin className={cn(
              'h-5 w-5',
              isLocked ? 'text-zinc-600' : isCompleted ? 'text-green-400' : isFailed ? 'text-red-400' : 'text-[var(--gold)]'
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-xs uppercase tracking-wider mb-0.5 font-sans font-bold',
              isLocked ? 'text-zinc-600' : isCompleted ? 'text-green-500/70' : isFailed ? 'text-red-500/70' : 'text-[var(--gold-dim)]'
            )}>
              Region {index + 1}
            </p>
            <h3 className={cn(
              'font-serif text-lg font-black leading-tight',
              isLocked ? 'text-zinc-700' : isCompleted ? 'text-green-400' : isFailed ? 'text-red-400' : 'text-[var(--gold)]'
            )}>
              {concept.location}
            </h3>
          </div>
        </div>

        <h4 className={cn(
          'font-bold mb-2 line-clamp-2',
          isLocked ? 'text-zinc-600' : 'text-zinc-100'
        )}>
          {concept.name}
        </h4>

        <p className={cn(
          'text-sm line-clamp-2 mb-4 leading-relaxed',
          isLocked ? 'text-zinc-700' : 'text-zinc-400 font-serif italic'
        )}>
          {concept.description}
        </p>

        {/* Mastery Progress Bar */}
        <div className="mt-auto space-y-2.5 mb-4">
          <div className={cn(
            "flex justify-between text-[10px] uppercase tracking-[0.1em] font-black",
            isLocked ? "text-zinc-700" : isCompleted ? "text-green-500" : isFailed ? "text-red-500" : "text-[var(--gold-dim)]"
          )}>
            <span>Mastery Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress 
            value={progressPercent} 
            className={cn(
              "h-1.5 bg-zinc-900 shadow-inner", 
              isCompleted ? "bg-green-500" : isFailed ? "bg-red-500" : "bg-[var(--gold)]"
            )} 
          />
        </div>

        <div className={cn(
          'flex items-center justify-between pt-3',
          isLocked ? 'border-t border-zinc-800/50' : 'border-t border-zinc-800'
        )}>
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  'h-3.5 w-3.5 transition-colors',
                  isLocked
                    ? 'text-zinc-800'
                    : i < config.stars 
                      ? (isCompleted ? 'fill-green-500 text-green-500' : isFailed ? 'fill-red-500 text-red-500' : 'fill-[var(--gold)] text-[var(--gold)]')
                      : 'text-zinc-800'
                )} 
              />
            ))}
            <span className={cn('ml-1.5 text-[10px] font-black uppercase', isLocked ? 'text-zinc-700' : 'text-zinc-500')}>
              {config.label}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm font-black font-serif">
            {isCompleted ? (
              <span className="text-green-400">+{concept.xpReward} XP</span>
            ) : isFailed ? (
              <span className="text-red-500">FAILED</span>
            ) : isLocked ? (
              <span className="text-zinc-700">LOCKED</span>
            ) : (
              <span className="text-[var(--gold)]">{concept.xpReward} XP</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}