'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WorldMap } from '@/components/world-map'
import { ChallengeModal } from '@/components/challenge-modal'
import { TutorialModal } from '@/components/tutorial-modal'
import { Scroll, CheckCircle2 } from 'lucide-react'
import { getWorldMapById, loadProgress, saveWorldMap, addXpAndUpdateProgress, hasSeenTutorial, markTutorialSeen } from '@/lib/storage'
import type { WorldMap as WorldMapType, Concept, UserProgress } from '@/lib/types'

function AdventureContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const worldMapId = searchParams.get('id')
  
  const [worldMap, setWorldMap] = useState<WorldMapType | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (worldMapId) {
      const map = getWorldMapById(worldMapId)
      setWorldMap(map)
    }
    setProgress(loadProgress())
    setShowTutorial(!hasSeenTutorial())
  }, [worldMapId])

  const handleDismissTutorial = useCallback(() => {
    markTutorialSeen()
    setShowTutorial(false)
  }, [])

  const handleBackToDashboard = useCallback(() => {
    router.push('/')
  }, [router])

  const handleConceptComplete = useCallback((conceptId: string, xpAwarded: number) => {
    if (!worldMap) return

    const updatedConcepts = worldMap.concepts.map(c =>
      c.id === conceptId ? { ...c, completed: true, progress: 100 } : c
    )
    const updatedWorldMap = { ...worldMap, concepts: updatedConcepts }
    setWorldMap(updatedWorldMap)
    saveWorldMap(updatedWorldMap)

    const newProgress = addXpAndUpdateProgress(xpAwarded, conceptId)
    setProgress(newProgress)
    setSelectedConcept(null)
  }, [worldMap])

  if (!mounted) return null

  if (!worldMap) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="h-20 w-20 rounded-full bg-black/20 border-2 border-[var(--gold-dim)] flex items-center justify-center shadow-xl">
          <Scroll className="h-10 w-10 text-[var(--gold-dim)]" />
        </div>
        <h1 className="text-3xl font-serif font-black text-[var(--gold)] uppercase tracking-tighter">Adventure Not Found</h1>
        <Link href="/">
          <Button className="bg-[var(--gold)] text-black font-black uppercase gold-glow h-12 px-8">
            Return to Sanctuary
          </Button>
        </Link>
      </div>
    )
  }

  const allCompleted = worldMap.concepts.every(c => c.completed)

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {allCompleted && worldMap.concepts.length > 0 && (
          <div className="mb-12 p-8 rounded-2xl parchment-texture border-2 border-[var(--success)]/40 shadow-[0_0_30px_rgba(34,197,94,0.15)] text-center animate-border-glow">
            <CheckCircle2 className="h-16 w-16 text-[var(--success)] mx-auto mb-4" />
            <h2 className="font-serif text-3xl font-black text-[var(--gold)] uppercase mb-2">Mastery Achieved</h2>
            <Link href="/">
              <Button className="bg-[var(--gold)] hover:bg-[var(--gold-dim)] text-black font-black uppercase gold-glow h-14 px-10 text-lg">
                Seek New Knowledge
              </Button>
            </Link>
          </div>
        )}

        <WorldMap
          title={worldMap.title}
          concepts={worldMap.concepts}
          onSelectConcept={setSelectedConcept}
          onBack={handleBackToDashboard}
        />
      </div>

      {selectedConcept && (
        <ChallengeModal
          concept={selectedConcept}
          worldMap={worldMap}
          onClose={() => setSelectedConcept(null)}
          onComplete={handleConceptComplete}
        />
      )}

      {showTutorial && <TutorialModal onDismiss={handleDismissTutorial} />}
    </main>
  )
}

export default function AdventurePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AdventureContent />
    </Suspense>
  )
}