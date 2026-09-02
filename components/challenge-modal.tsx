'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import {
  X, Send, Star, Swords, Heart,
  Sparkles, FlaskConical, ShieldCheck, MessageSquare
} from 'lucide-react'
import type { Concept, WorldMap, EvaluationResult } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ScholarSprite, SageSprite } from '@/components/sprites'

function getMessageText(parts: Array<{ type: string; text?: string }> | undefined): string {
  if (!parts || !Array.isArray(parts)) return ''
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map(p => p.text)
    .join('')
}

export function ChallengeModal({ concept, worldMap, onClose, onComplete }: any) {
  // --- STATE ---
  const [input, setInput] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [health, setHealth] = useState(100)
  const [accumulatedXp, setAccumulatedXp] = useState(0)
  const [showXpFloat, setShowXpFloat] = useState(false)
  const [floatXp, setFloatXp] = useState(0)

  // --- ATTACK / HEAL FX ---
  const [isShaking, setIsShaking] = useState(false)
  const [flashKind, setFlashKind] = useState<'damage' | 'heal' | null>(null)
  const [hpFloat, setHpFloat] = useState<{ amount: number; kind: 'damage' | 'heal' } | null>(null)

  const triggerDamage = (amount: number) => {
    setIsShaking(true)
    setFlashKind('damage')
    setHpFloat({ amount, kind: 'damage' })
    setTimeout(() => setIsShaking(false), 500)
    setTimeout(() => setFlashKind(null), 400)
    setTimeout(() => setHpFloat(null), 1300)
  }

  const triggerHeal = (amount: number) => {
    setFlashKind('heal')
    setHpFloat({ amount, kind: 'heal' })
    setTimeout(() => setFlashKind(null), 400)
    setTimeout(() => setHpFloat(null), 1300)
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // FIX: Track processed message IDs to prevent double-counting XP
  const lastProcessedId = useRef<string | null>(null)

  const [shieldsUsed, setShieldsUsed] = useState(0)
  const maxHints = 3
  const maxShields = 1

  // Starter Options
  const starters = [
    `I am ready to face the riddle of ${concept?.name || 'this concept'}.`,
    `What sacred knowledge is guarded here?`,
    `Grant me the first trial of wisdom, Master.`
  ]

  const userId = useMemo(() => {
    if (typeof window === 'undefined') return 'rj-guest'
    const saved = localStorage.getItem('adventure_user_id')
    if (saved) return saved
    const newId = `scholar_${Math.random().toString(36).substring(7)}`
    localStorage.setItem('adventure_user_id', newId)
    return newId
  }, [])

  const { messages, append, status, error } = useChat({
    id: `challenge-${concept?.id || 'unknown'}`,
    api: '/api/dungeon-master',
    body: {
      user_id: userId,
      concept,
      worldTitle: worldMap?.title,
      video_url: worldMap?.sourceText,
    },
  })

  const isStreaming = status === 'streaming'
  const isReady = status === 'ready'

  // --- MESSAGE & TAG PROCESSING (FIXED) ---
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    
    // Only process if message is from assistant, streaming is done, and it's a new message ID
    if (lastMsg && lastMsg.role === 'assistant' && !isStreaming && lastMsg.id !== lastProcessedId.current) {
      const text = getMessageText(lastMsg.parts);
      lastProcessedId.current = lastMsg.id;
      
      // 1. Process XP Tags
      const xpMatch = text.match(/\[XP_AWARDED:(\d+)\]/);
      if (xpMatch) {
        const gainedXp = parseInt(xpMatch[1], 10);
        
        setAccumulatedXp(prev => {
          const newTotal = prev + gainedXp;
          if (newTotal >= 100 && !evaluationResult) {
            setEvaluationResult({
              passed: true,
              feedback: "You have proven your mastery over this concept!",
              correctPoints: ['100 XP Milestone Reached'],
              missedPoints: [],
              xpAwarded: newTotal,
            });
          }
          return newTotal;
        });

        setFloatXp(gainedXp);
        setShowXpFloat(true);
        setTimeout(() => setShowXpFloat(false), 2000);
      }

      // 2. Process HP Loss Tags
      const hpMatch = text.match(/\[HP_LOSS:(\d+)\]/);
      if (hpMatch) {
        const penalty = parseInt(hpMatch[1], 10);
        setHealth(prev => Math.max(0, prev - penalty));
        triggerDamage(penalty);
      }
    }
  }, [messages, isStreaming]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  const handleSend = (textOverride?: string) => {
    const content = textOverride || input.trim()
    if (!content || isStreaming || isEvaluating || evaluationResult) return
    append({ role: 'user', content })
    setInput('')
  }

  const handleHint = () => {
    if (isStreaming || isEvaluating || hintsUsed >= maxHints || evaluationResult) return
    setHintsUsed(prev => prev + 1)
    setHealth(prev => Math.max(0, prev - 10))
    handleSend('I need a hint from the spirits of this place.')
  }

  const handleShield = () => {
    if (shieldsUsed >= maxShields || health >= 100 || evaluationResult) return
    setShieldsUsed(prev => prev + 1)
    const healed = Math.min(30, 100 - health)
    setHealth(prev => Math.min(100, prev + 30))
    triggerHeal(healed)
  }

  const handleComplete = () => { 
    if (evaluationResult) onComplete(concept.id, accumulatedXp) 
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // --- GUARD CLAUSE --- (after all hooks, so hook order stays stable across renders)
  if (!concept || !worldMap) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      {showXpFloat && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
          <span className="animate-xp-float text-4xl font-serif font-bold text-[var(--gold)] drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">
            +{floatXp} XP
          </span>
        </div>
      )}

      {hpFloat && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
          <span
            className={cn(
              "animate-hp-float text-4xl font-serif font-bold drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]",
              hpFloat.kind === 'damage' ? "text-[var(--health)]" : "text-green-400"
            )}
          >
            {hpFloat.kind === 'damage' ? '-' : '+'}{hpFloat.amount} HP
          </span>
        </div>
      )}

      <div className={cn("w-full max-w-4xl max-h-[95vh] flex gap-4", isShaking && "animate-screen-shake")}>
        <div className="flex-1 flex flex-col parchment-texture rounded-lg overflow-hidden animate-border-glow relative">
          {/* Damage/heal flash overlay */}
          {flashKind && (
            <div
              className={cn(
                "absolute inset-0 z-40 pointer-events-none animate-damage-flash",
                flashKind === 'damage' ? "bg-red-600/40" : "bg-green-500/30"
              )}
            />
          )}

          {/* Progress Bar (Cumulative XP) */}
          <div className="h-2 bg-[var(--muted)] relative overflow-hidden">
             <div
               className="h-full bg-[var(--gold)] transition-all duration-1000 ease-out"
               style={{ width: `${Math.min(100, accumulatedXp)}%` }}
             />
          </div>

          <div className="flex items-start justify-between p-4 border-b border-[var(--gold-dim)]/30">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg stone-texture">
                <Swords className="h-6 w-6 text-[var(--gold)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--gold-dim)] uppercase tracking-wider font-sans">Sacred Trial</p>
                <h2 className="font-serif text-xl text-[var(--gold)] font-semibold">{concept?.location}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-[var(--parchment-dark)] font-mono">Progress: {accumulatedXp}/100 XP</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-[var(--parchment-dark)] hover:text-[var(--gold)]">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="px-4 py-2 bg-black/20">
            <div className="flex items-center gap-3">
              <Heart className={cn("h-4 w-4 text-[var(--health)]", health <= 30 && "animate-health-pulse")} />
              <div className="flex-1 h-3 bg-[var(--muted)] rounded-full overflow-hidden relative">
                {/* Ghost bar drains slowly behind the main bar for a "chip damage" effect */}
                <div className="absolute inset-y-0 left-0 health-bar-ghost" style={{ width: `${health}%` }} />
                <div className="absolute inset-y-0 left-0 health-bar transition-all duration-200" style={{ width: `${health}%` }} />
              </div>
              <span className="text-xs font-mono text-[var(--parchment-dark)]">{health}/100</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-[250px]">
            {/* STARTER BUBBLES */}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center space-y-4 py-10">
                <div className="h-12 w-12 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mb-2">
                  <MessageSquare className="h-6 w-6 text-[var(--gold)]" />
                </div>
                <p className="text-[var(--gold-dim)] font-serif italic text-sm mb-4 uppercase tracking-widest">Approach the Master...</p>
                <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                  {starters.map((starter, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(starter)}
                      className="text-left px-5 py-4 rounded-2xl bg-[var(--parchment-bg)] border border-[var(--gold-dim)]/30 text-[var(--parchment)] text-sm hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 transition-all duration-300 shadow-md animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${idx * 150}ms` }}
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
                const text = getMessageText(message.parts).replace(/\[XP_AWARDED:\d+\]/g, '').replace(/\[HP_LOSS:\d+\]/g, '')
                if (!text) return null
                const isUser = message.role === 'user'

                return (
                  <div key={message.id} className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--gold-dim)] mb-1 px-1">
                      {isUser ? 'Scholar' : 'Dungeon Master'}
                    </span>
                    <div className={cn('flex gap-3 max-w-[85%]', isUser ? 'flex-row-reverse' : 'flex-row')}>
                      <div className={cn('flex items-center justify-center h-9 w-9 rounded-lg shrink-0 mt-1 p-1', isUser ? 'stone-texture' : 'bg-[var(--gold)]/10 border border-[var(--gold-dim)]/50')}>
                        {isUser ? <ScholarSprite className="h-full w-full" /> : <SageSprite className="h-full w-full" />}
                      </div>
                      <div className={cn('rounded-2xl px-4 py-3 shadow-md', isUser ? 'stone-texture text-[var(--parchment)] rounded-tr-none' : 'bg-[var(--parchment-bg)] border border-[var(--gold-dim)]/30 text-[var(--parchment)] rounded-tl-none')}>
                        <p className={cn("text-sm whitespace-pre-wrap leading-relaxed", !isUser && "font-serif italic")}>{text}</p>
                      </div>
                    </div>
                  </div>
                )
              })}

            {/* TYPING INDICATOR (Bouncing Sage sprite and dots) */}
            {status === 'submitted' && (
              <div className="flex flex-col items-start animate-in fade-in duration-300">
                <span className="text-[10px] uppercase tracking-widest text-[var(--gold-dim)] mb-1 px-1">
                  Dungeon Master
                </span>
                <div className="flex gap-3 max-w-[85%] flex-row">
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0 mt-1 p-1 bg-[var(--gold)]/10 border border-[var(--gold-dim)]/50">
                    <SageSprite className="h-full w-full animate-bounce" />
                  </div>
                  <div className="rounded-2xl px-5 py-3 shadow-md bg-[var(--parchment-bg)] border border-[var(--gold-dim)]/30 text-[var(--parchment)] rounded-tl-none flex items-center min-h-[44px]">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]/60 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]/60 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]/60 animate-bounce" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-[var(--gold-dim)]/30 bg-black/20">
            {error && (
              <div className="mb-3 p-3 rounded-lg bg-[var(--health)]/10 border border-[var(--health)]/30 text-[var(--health)] text-sm">
                The Sage is resting (the AI is overloaded or its free quota ran out). Please wait a moment and try again.
              </div>
            )}
            {evaluationResult ? (
              <Button className="w-full h-14 text-lg font-serif font-semibold gap-3 bg-[var(--gold)] hover:bg-[var(--gold-dim)] text-black gold-glow" onClick={handleComplete}>
                <Sparkles className="h-5 w-5" /> Ascend with {accumulatedXp} XP
              </Button>
            ) : (
              <div className="flex gap-2">
                <Textarea 
                  ref={textareaRef} 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={handleKeyDown} 
                  placeholder={messages.length === 0 ? "Approach to begin..." : "Answer the Master's query..."} 
                  className="min-h-[80px] resize-none bg-[var(--input)] border-[var(--gold-dim)]/30 text-[var(--parchment)]" 
                  disabled={isStreaming || health <= 0 || messages.length === 0} 
                />
                <Button 
                  size="icon" 
                  onClick={() => handleSend()} 
                  disabled={!input.trim() || isStreaming || health <= 0 || messages.length === 0} 
                  className="h-auto min-w-[50px] bg-[var(--gold)] text-black gold-glow"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            )}
            {health <= 0 && !evaluationResult && (
                <p className="text-center text-[var(--health)] mt-2 font-serif italic">Your strength has faded. The trial is lost.</p>
            )}
          </div>
        </div>

        {/* Inventory Sidebar */}
        <div className="w-48 flex-shrink-0 hidden lg:flex flex-col gap-4">
          <div className="parchment-texture rounded-lg p-4 text-center animate-border-glow">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--gold)]/20 border-2 border-[var(--gold-dim)] flex items-center justify-center mb-2 p-3">
              <ScholarSprite className="h-full w-full" />
            </div>
            <p className="text-xs text-[var(--gold-dim)] uppercase tracking-wider">Scholar</p>
            <p className="font-serif text-[var(--gold)] text-sm">Trial Progress</p>
          </div>
          
          <div className="parchment-texture rounded-lg p-4 flex-1 animate-border-glow">
             <h3 className="font-serif text-sm text-[var(--gold)] mb-4 text-center uppercase tracking-wider">Inventory</h3>
             <div className="mb-4">
               <button 
                 onClick={handleHint} 
                 disabled={hintsUsed >= maxHints || isStreaming || !!evaluationResult || messages.length === 0} 
                 className={cn("w-full p-3 rounded-lg border-2 transition-all", hintsUsed < maxHints && messages.length > 0 ? "border-[var(--gold-dim)] hover:border-[var(--gold)]" : "opacity-50 cursor-not-allowed")}
               >
                 <FlaskConical className={cn("h-8 w-8 mx-auto mb-2", hintsUsed < maxHints ? "text-[var(--gold)]" : "text-[var(--muted-foreground)]")} />
                 <p className="text-xs text-[var(--parchment-dark)]">Hint Potion</p>
                 <p className="text-xs text-[var(--gold-dim)]">{maxHints - hintsUsed}/{maxHints}</p>
               </button>
             </div>
             <div>
               <button 
                 onClick={handleShield} 
                 disabled={shieldsUsed >= maxShields || health >= 100 || !!evaluationResult} 
                 className={cn("w-full p-3 rounded-lg border-2 transition-all", shieldsUsed < maxShields && health < 100 ? "border-[var(--gold-dim)] hover:border-[var(--gold)]" : "opacity-50 cursor-not-allowed")}
               >
                 <ShieldCheck className={cn("h-8 w-8 mx-auto mb-2", shieldsUsed < maxShields ? "text-[var(--gold)]" : "text-[var(--muted-foreground)]")} />
                 <p className="text-xs text-[var(--parchment-dark)]">Health Shield</p>
                 <p className="text-xs text-[var(--gold-dim)]">{maxShields - shieldsUsed}/{maxShields}</p>
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>  
  )
}