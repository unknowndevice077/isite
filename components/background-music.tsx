'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

const MUSIC_PREF_KEY = 'study-buddy-music-on'

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null)
  // Start off by default — browsers block autoplay-with-sound anyway, and it's
  // a more polite default than blasting music the instant someone lands here.
  const [isOn, setIsOn] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      setIsOn(localStorage.getItem(MUSIC_PREF_KEY) === 'true')
    } catch {
      // ignore
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    const audio = audioRef.current
    if (!audio) return

    if (isOn) {
      audio.volume = 0.35
      audio.play().catch(() => {
        // Autoplay can still be blocked (e.g. no prior user gesture at all) —
        // fail quietly, the toggle stays available to retry.
      })
    } else {
      audio.pause()
    }

    try {
      localStorage.setItem(MUSIC_PREF_KEY, String(isOn))
    } catch {
      // ignore
    }
  }, [isOn, ready])

  return (
    <>
      <audio ref={audioRef} src="/audio/medieval-theme.mp3" loop preload="none" />
      <button
        type="button"
        onClick={() => setIsOn((prev) => !prev)}
        title={isOn ? 'Mute music' : 'Play medieval theme'}
        aria-label={isOn ? 'Mute background music' : 'Play background music'}
        className={cn(
          'fixed bottom-4 right-4 z-[70] h-11 w-11 rounded-full flex items-center justify-center',
          'stone-texture border-2 transition-all duration-300 shadow-lg',
          isOn
            ? 'border-[var(--gold)] text-[var(--gold)] shadow-[0_0_15px_rgba(255,215,0,0.35)]'
            : 'border-[var(--gold-dim)]/50 text-[var(--gold-dim)] hover:border-[var(--gold)] hover:text-[var(--gold)]',
        )}
      >
        {isOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>
    </>
  )
}
