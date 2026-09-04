'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, FileDown } from 'lucide-react'
import { exportStudyGuideMarkdown, exportStudyGuidePdf } from '@/lib/export'
import type { WorldMap } from '@/lib/types'

interface ExportMenuProps {
  worldMap: Pick<WorldMap, 'title' | 'synopsis' | 'concepts'>
}

export function ExportMenu({ worldMap }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handlePdf = async () => {
    setIsExportingPdf(true)
    try {
      await exportStudyGuidePdf(worldMap)
    } finally {
      setIsExportingPdf(false)
      setOpen(false)
    }
  }

  const handleMarkdown = () => {
    exportStudyGuideMarkdown(worldMap)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className="border-[var(--gold-dim)]/50 text-[var(--gold)] hover:bg-[var(--gold)]/10 font-serif px-6 py-5 gap-2 uppercase font-black tracking-widest text-xs"
      >
        <Download className="h-4 w-4" />
        Export Study Guide
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-lg parchment-texture border border-[var(--gold-dim)]/40 shadow-xl overflow-hidden z-20">
          <button
            type="button"
            onClick={handlePdf}
            disabled={isExportingPdf}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm text-[var(--parchment)] hover:bg-[var(--gold)]/10 transition-colors disabled:opacity-50"
          >
            <FileDown className="h-4 w-4 text-[var(--gold)]" />
            {isExportingPdf ? 'Generating…' : 'Download as PDF'}
          </button>
          <button
            type="button"
            onClick={handleMarkdown}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm text-[var(--parchment)] hover:bg-[var(--gold)]/10 transition-colors border-t border-[var(--gold-dim)]/20"
          >
            <FileText className="h-4 w-4 text-[var(--gold)]" />
            Download as Markdown
          </button>
        </div>
      )}
    </div>
  )
}
