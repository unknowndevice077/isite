'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { 
  X, Send, Lightbulb, CheckCircle2, Star, Scroll, User, Swords, Shield, 
  Heart, Sparkles, FlaskConical, ShieldCheck 
} from 'lucide-react'
import type { Concept, WorldMap, EvaluationResult } from '@/lib/types'
import { cn } from '@/lib/utils'

function getMessageText(parts: Array<{ type: string; text?: string }> | undefined): string {
  if (!parts || !Array.isArray(parts)) return ''
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map(p => p.text)
    .join('')
}

export function ChallengeModal({ concept, worldMap, onClose, onComplete }: ChallengeModalProps) {
  const [input, setInput] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [health, setHealth] = useState(100)
  const [showXpFloat, setShowXpFloat] = useState(false)
  const [floatXp, setFloatXp] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(180) 
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const maxHints = 3
  const maxShields = 1
  const [shieldsUsed, setShieldsUsed] = useState(0)

  // 1. Logic: Persistent User ID for history linking
  const userId = useMemo(() => {
    if (typeof window === 'undefined') return 'rj-guest'
    const saved = localStorage.getItem('adventure_user_id')
    if (saved) return saved
    const newId = `scholar_${Math.random().toString(36).substring(7)}`
    localStorage.setItem('adventure_user_id', newId)
    return newId
  }, [])

  // 2. Messaging Hook: FIXED DESTRUCTURING
  // We include 'append' here so it is defined for the useEffect below
  const { messages, append, status } = useChat({
    id: `challenge-${concept.id}`,
    api: '/api/dungeon-master',
    body: {
      user_id: userId,
      concept,
      worldTitle: worldMap.title,
      video_url: worldMap.sourceText,
    },
  })

  const isStreaming = status === 'streaming'
  const isReady = status === 'ready'

  // Timer Countdown
  useEffect(() => {
    if (evaluationResult) return
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [evaluationResult])

  // 3. Logic: Auto-start adventure with append
  // Since 'append' is now in the destructuring above, this will no longer crash
  useEffect(() => {
    if (messages.length === 0 && isReady) {
      append({ 
        role: 'user', 
        content: 'I approach this location and am ready to face the challenge.' 
      })
    }
  }, [messages.length, isReady, append])

  // 4. Logic: Monitor for XP Rewards
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && !isStreaming) {
      const text = getMessageText(lastMsg.parts);
      const xpMatch = text.match(/\[XP_AWARDED:(\d+)\]\n/);
      if (xpMatch && !evaluationResult) {
        const xp = parseInt(xpMatch[1], 10);
        const healthPenalty = health < 100 ? Math.floor((100 - health) / 20) * 5 : 0;
        const finalXp = Math.max(0, xp - healthPenalty);
        
        setEvaluationResult({
          passed: true,
          feedback: text.replace(xpMatch[0], ''),
          correctPoints: ['The Dungeon Master is satisfied with your progress!'],
          missedPoints: [],
          xpAwarded: finalXp,
        });

        if (finalXp > 0) {
          setFloatXp(finalXp);
          setShowXpFloat(true);
          setTimeout(() => setShowXpFloat(false), 2000);
        }
      }
    }
  }, [messages, isStreaming, evaluationResult, health]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isStreaming || isEvaluating) return
    append({ role: 'user', content: input.trim() })
    setInput('')
  }

  const handleHint = () => {
    if (isStreaming || isEvaluating || hintsUsed >= maxHints) return
    setHintsUsed(prev => prev + 1)
    setHealth(prev => Math.max(0, prev - 10))
    append({ role: 'user', content: 'I need a hint to help me understand this concept better.' })
  }

  const handleShield = () => {
    if (shieldsUsed >= maxShields || health >= 100) return
    setShieldsUsed(prev => prev + 1)
    setHealth(prev => Math.min(100, prev + 30))
  }

  const handleEvaluate = async () => {
    if (isStreaming || isEvaluating || messages.length < 2) return
    setIsEvaluating(true)
    try {
      const userMessages = messages.filter(m => m.role === 'user').map(m => getMessageText(m.parts)).join('\n')
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          userExplanation: userMessages,
          conversationContext: messages.map(m => ({ role: m.role, content: getMessageText(m.parts) })),
        }),
      })
      if (!response.ok) throw new Error('Evaluation failed')
      const result: EvaluationResult = await response.json()
      const healthPenalty = health < 100 ? Math.floor((100 - health) / 20) * 5 : 0
      const finalXp = Math.max(0, result.xpAwarded - healthPenalty)
      result.xpAwarded = finalXp
      setEvaluationResult(result)
      if (finalXp > 0) {
        setFloatXp(finalXp); setShowXpFloat(true);
        setTimeout(() => setShowXpFloat(false), 1500)
      }
      if (!result.passed) setHealth(prev => Math.max(0, prev - 20))
    } catch {
      setEvaluationResult({ passed: false, feedback: 'Evaluation failed.', correctPoints: [], missedPoints: [], xpAwarded: 0 })
    } finally { setIsEvaluating(false) }
  }

  const handleComplete = () => { if (evaluationResult) onComplete(concept.id, evaluationResult.xpAwarded) }
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }
  const formatTime = (seconds: number) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins}:${secs.toString().padStart(2, '0')}` }
  const timerPercent = (timeRemaining / 180) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      {showXpFloat && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
          <span className="animate-xp-float text-4xl font-serif font-bold text-[var(--gold)] drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">
            +{floatXp} XP
          </span>
        </div>
      )}

      <div className="w-full max-w-4xl max-h-[95vh] flex gap-4">
        {/* Main Quest Area */}
        <div className="flex-1 flex flex-col parchment-texture rounded-lg overflow-hidden animate-border-glow">
          <div className="h-1.5 bg-[var(--muted)] relative overflow-hidden">
            <div className="h-full timer-bar transition-all duration-1000 ease-linear" style={{ width: `${timerPercent}%` }} />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-[var(--gold-dim)]/30">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg stone-texture">
                <Swords className="h-6 w-6 text-[var(--gold)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--gold-dim)] uppercase tracking-wider font-sans">Sacred Riddle</p>
                <h2 className="font-serif text-xl text-[var(--gold)] font-semibold">{concept.location}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: concept.difficulty === 'easy' ? 1 : concept.difficulty === 'medium' ? 2 : 3 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-[var(--gold)] text-[var(--gold)]" />
                    ))}
                  </div>
                  <span className="text-xs text-[var(--parchment-dark)]">{concept.xpReward} XP Reward</span>
                  <span className="text-xs text-[var(--gold-dim)]">{formatTime(timeRemaining)}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 text-[var(--parchment-dark)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Health Bar */}
          <div className="px-4 py-2 bg-black/20">
            <div className="flex items-center gap-3">
              <Heart className={cn("h-4 w-4", health <= 30 ? "text-[var(--health)] animate-health-pulse" : "text-[var(--health)]")} />
              <div className="flex-1 h-3 bg-[var(--muted)] rounded-full overflow-hidden">
                <div className="h-full health-bar transition-all duration-500 rounded-full" style={{ width: `${health}%` }} />
              </div>
              <span className="text-xs font-mono text-[var(--parchment-dark)]">{health}/100</span>
            </div>
          </div>

          {/* Chat History UI */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-[250px]">
            {messages
              .filter(m => getMessageText(m.parts) !== 'I approach this location and am ready to face the challenge.')
              .map((message) => {
                const text = getMessageText(message.parts).replace(/\[XP_AWARDED:\d+\]\n/, '')
                if (!text) return null
                const isUser = message.role === 'user'

                return (
                  <div key={message.id} className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--gold-dim)] mb-1 px-1">
                      {isUser ? 'Scholar' : 'Dungeon Master'}
                    </span>
                    
                    <div className={cn('flex gap-3 max-w-[85%]', isUser ? 'flex-row-reverse' : 'flex-row')}>
                      <div className={cn(
                        'flex items-center justify-center h-9 w-9 rounded-lg shrink-0 mt-1', 
                        isUser ? 'stone-texture' : 'bg-[var(--gold)]/10 border border-[var(--gold-dim)]/50'
                      )}>
                        {isUser ? <User className="h-4 w-4 text-[var(--gold)]" /> : <Scroll className="h-4 w-4 text-[var(--gold)]" />}
                      </div>

                      <div className={cn(
                        'rounded-2xl px-4 py-3 shadow-md',
                        isUser 
                          ? 'stone-texture text-[var(--parchment)] rounded-tr-none' 
                          : 'bg-[var(--parchment-bg)] border border-[var(--gold-dim)]/30 text-[var(--parchment)] rounded-tl-none'
                      )}>
                        <p className={cn("text-sm whitespace-pre-wrap leading-relaxed", !isUser && "font-serif italic")}>
                          {text}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-[var(--gold-dim)]/30 bg-black/20">
            {evaluationResult ? (
              <Button className="w-full h-14 text-lg font-serif font-semibold gap-3 bg-[var(--gold)] hover:bg-[var(--gold-dim)] text-black gold-glow" onClick={handleComplete}>
                <Sparkles className="h-5 w-5" /> Claim {evaluationResult.xpAwarded} XP and Continue
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Speak your wisdom..." className="min-h-[80px] resize-none bg-[var(--input)] border-[var(--gold-dim)]/30 text-[var(--parchment)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--gold)]/50" disabled={isStreaming || isEvaluating} />
                  <Button size="icon" onClick={handleSend} disabled={!input.trim() || isStreaming || isEvaluating} className="h-auto min-w-[50px] bg-[var(--gold)] hover:bg-[var(--gold-dim)] text-black gold-glow">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={onClose} className="border-[var(--health)] text-[var(--health)] hover:bg-[var(--health)]/10"> <X className="h-4 w-4 mr-2" /> Flee Quest </Button>
                  <Button onClick={handleEvaluate} disabled={isStreaming || isEvaluating || messages.length < 2} className="bg-[var(--gold)] hover:bg-[var(--gold-dim)] text-black font-semibold gold-glow gap-2">
                    {isEvaluating ? <><Spinner className="h-4 w-4" /> Casting Spell...</> : <><Sparkles className="h-4 w-4" /> Cast Spell (Submit)</>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Inventory */}
        <div className="w-48 flex-shrink-0 hidden lg:flex flex-col gap-4">
          <div className="parchment-texture rounded-lg p-4 text-center animate-border-glow">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--gold)]/20 border-2 border-[var(--gold-dim)] flex items-center justify-center mb-2"> <Shield className="h-8 w-8 text-[var(--gold)]" /> </div>
            <p className="text-xs text-[var(--gold-dim)] uppercase tracking-wider">Scholar</p>
            <p className="font-serif text-[var(--gold)] text-sm">Level 1</p>
          </div>
          <div className="parchment-texture rounded-lg p-4 flex-1 animate-border-glow">
            <h3 className="font-serif text-sm text-[var(--gold)] mb-4 text-center uppercase tracking-wider">Inventory</h3>
            <div className="mb-4">
              <button onClick={handleHint} disabled={hintsUsed >= maxHints || isStreaming || isEvaluating} className={cn("w-full p-3 rounded-lg border-2 transition-all", hintsUsed < maxHints ? "border-[var(--gold-dim)] hover:border-[var(--gold)] cursor-pointer" : "opacity-50 cursor-not-allowed")}>
                <FlaskConical className={cn("h-8 w-8 mx-auto mb-2", hintsUsed < maxHints ? "text-[var(--gold)]" : "text-[var(--muted-foreground)]")} />
                <p className="text-xs text-[var(--parchment-dark)]">Hint Potion</p>
                <p className="text-xs text-[var(--gold-dim)]">{maxHints - hintsUsed}/{maxHints}</p>
              </button>
            </div>
            <div>
              <button onClick={handleShield} disabled={shieldsUsed >= maxShields || health >= 100} className={cn("w-full p-3 rounded-lg border-2 transition-all", shieldsUsed < maxShields && health < 100 ? "border-[var(--gold-dim)] hover:border-[var(--gold)] cursor-pointer" : "opacity-50 cursor-not-allowed")}>
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