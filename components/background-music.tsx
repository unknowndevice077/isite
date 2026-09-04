'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX, Volume1 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MUSIC_PREF_KEY = 'study-buddy-music-on'
const MUSIC_VOLUME_KEY = 'study-buddy-music-volume'
const DEFAULT_VOLUME = 0.35

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null)
  // Start off by default — browsers block autoplay-with-sound anyway, and it's
  // a more polite default than blasting music the instant someone lands here.
  const [isOn, setIsOn] = useState(false)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      setIsOn(localStorage.getItem(MUSIC_PREF_KEY) === 'true')
      const savedVolume = localStorage.getItem(MUSIC_VOLUME_KEY)
      if (savedVolume !== null) {
        const parsed = parseFloat(savedVolume)
        if (!Number.isNaN(parsed)) setVolume(Math.min(1, Math.max(0, parsed)))
      }
    } catch {
      // ignore
    }
    setReady(true)
  }, [])

  // Volume applies live, independent of play/pause, so dragging the slider
  // while music is already playing hears the change immediately.
  useEffect(() => {
    if (!ready) return
    if (audioRef.current) audioRef.current.volume = volume
    try {
      localStorage.setItem(MUSIC_VOLUME_KEY, String(volume))
    } catch {
      // ignore
    }
  }, [volume, ready])

  useEffect(() => {
    if (!ready) return
    const audio = audioRef.current
    if (!audio) return

    if (isOn) {
      audio.volume = volume
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
    // volume intentionally excluded — that's handled by its own effect above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOn, ready])

  const VolumeIcon = !isOn || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <>
      <audio ref={audioRef} src="/audio/medieval-theme.mp3" loop preload="none" />
      <div
        className={cn(
          'fixed bottom-4 right-4 z-[70] flex items-center gap-2 h-11 rounded-full',
          'stone-texture border-2 transition-all duration-300 shadow-lg px-2',
          isOn
            ? 'border-[var(--gold)] shadow-[0_0_15px_rgba(255,215,0,0.35)]'
            : 'border-[var(--gold-dim)]/50',
        )}
      >
        <button
          type="button"
          onClick={() => setIsOn((prev) => !prev)}
          title={isOn ? 'Mute music' : 'Play medieval theme'}
          aria-label={isOn ? 'Mute background music' : 'Play background music'}
          className={cn(
            'h-7 w-7 shrink-0 rounded-full flex items-center justify-center transition-colors',
            isOn ? 'text-[var(--gold)]' : 'text-[var(--gold-dim)] hover:text-[var(--gold)]',
          )}
        >
          <VolumeIcon className="h-5 w-5" />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          aria-label="Music volume"
          title={`Volume: ${Math.round(volume * 100)}%`}
          className={cn(
            'w-16 accent-[var(--gold)] cursor-pointer transition-opacity',
            isOn ? 'opacity-100' : 'opacity-40',
          )}
        />
      </div>
    </>
  )
}
