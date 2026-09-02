'use client'

/**
 * Small hand-built pixel-art sprites for QuestScribe's two characters.
 * Drawn as inline SVG on a fixed grid (no external image assets — nothing
 * to license, host, or fail to load) so they render crisp at any size and
 * pick up the app's gold/parchment palette via currentColor.
 */

const GRID = 16

function Pixel({ x, y, fill }: { x: number; y: number; fill: string }) {
  return <rect x={x} y={y} width={1} height={1} fill={fill} />
}

function PixelSprite({
  className,
  pixels,
}: {
  className?: string
  pixels: Array<[number, number, string]>
}) {
  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      shapeRendering="crispEdges"
      className={className}
    >
      {pixels.map(([x, y, fill], i) => (
        <Pixel key={i} x={x} y={y} fill={fill} />
      ))}
    </svg>
  )
}

// The Scholar (player avatar) — a young adventurer in a hooded traveling cloak.
const SKIN = '#e8c19a'
const CLOAK = '#3a6f5c'
const CLOAK_DARK = '#2a5244'
const TRIM = '#ffd700'
const HAIR = '#5a3a24'

const scholarPixels: Array<[number, number, string]> = [
  // hood/hair
  [6, 2, HAIR], [7, 2, HAIR], [8, 2, HAIR], [9, 2, HAIR],
  [5, 3, HAIR], [6, 3, SKIN], [7, 3, SKIN], [8, 3, SKIN], [9, 3, SKIN], [10, 3, HAIR],
  // face
  [5, 4, SKIN], [6, 4, SKIN], [7, 4, '#1a1a1a'], [8, 4, SKIN], [9, 4, '#1a1a1a'], [10, 4, SKIN],
  [5, 5, SKIN], [6, 5, SKIN], [7, 5, SKIN], [8, 5, SKIN], [9, 5, SKIN], [10, 5, SKIN],
  [6, 6, SKIN], [7, 6, SKIN], [8, 6, SKIN], [9, 6, SKIN],
  // shoulders / cloak collar
  [4, 7, TRIM], [5, 7, CLOAK], [6, 7, CLOAK], [7, 7, CLOAK], [8, 7, CLOAK], [9, 7, CLOAK], [10, 7, CLOAK], [11, 7, TRIM],
  // torso / cloak body
  [3, 8, CLOAK], [4, 8, CLOAK], [5, 8, CLOAK_DARK], [6, 8, CLOAK], [7, 8, CLOAK], [8, 8, CLOAK], [9, 8, CLOAK_DARK], [10, 8, CLOAK], [11, 8, CLOAK], [12, 8, CLOAK],
  [3, 9, CLOAK], [4, 9, CLOAK], [5, 9, CLOAK_DARK], [6, 9, CLOAK], [7, 9, TRIM], [8, 9, CLOAK], [9, 9, CLOAK_DARK], [10, 9, CLOAK], [11, 9, CLOAK], [12, 9, CLOAK],
  [3, 10, CLOAK], [4, 10, CLOAK], [5, 10, CLOAK], [6, 10, CLOAK], [7, 10, CLOAK], [8, 10, CLOAK], [9, 10, CLOAK], [10, 10, CLOAK], [11, 10, CLOAK], [12, 10, CLOAK],
  [3, 11, CLOAK], [4, 11, CLOAK], [5, 11, CLOAK], [6, 11, CLOAK_DARK], [7, 11, CLOAK_DARK], [8, 11, CLOAK_DARK], [9, 11, CLOAK], [10, 11, CLOAK], [11, 11, CLOAK], [12, 11, CLOAK],
  // hem
  [3, 12, CLOAK_DARK], [4, 12, CLOAK_DARK], [5, 12, CLOAK_DARK], [6, 12, CLOAK_DARK], [7, 12, CLOAK_DARK], [8, 12, CLOAK_DARK], [9, 12, CLOAK_DARK], [10, 12, CLOAK_DARK], [11, 12, CLOAK_DARK], [12, 12, CLOAK_DARK],
  // boots
  [5, 13, '#1a1a1a'], [6, 13, '#1a1a1a'], [9, 13, '#1a1a1a'], [10, 13, '#1a1a1a'],
]

// The Sage (Dungeon Master NPC) — an ancient robed narrator with a glowing staff orb.
const ROBE = '#5b2a86'
const ROBE_DARK = '#3f1c60'
const BEARD = '#e5e5e5'
const ORB = '#ffe066'

const sagePixels: Array<[number, number, string]> = [
  // pointed hood
  [7, 1, TRIM], [8, 1, TRIM],
  [6, 2, ROBE], [7, 2, ROBE], [8, 2, ROBE], [9, 2, ROBE],
  [5, 3, ROBE], [6, 3, SKIN], [7, 3, SKIN], [8, 3, SKIN], [9, 3, SKIN], [10, 3, ROBE],
  // face + glowing eyes
  [5, 4, ROBE], [6, 4, SKIN], [7, 4, TRIM], [8, 4, SKIN], [9, 4, TRIM], [10, 4, ROBE],
  [5, 5, ROBE], [6, 5, SKIN], [7, 5, BEARD], [8, 5, BEARD], [9, 5, SKIN], [10, 5, ROBE],
  [5, 6, ROBE], [6, 6, BEARD], [7, 6, BEARD], [8, 6, BEARD], [9, 6, BEARD], [10, 6, ROBE],
  // shoulders
  [4, 7, ROBE], [5, 7, ROBE], [6, 7, BEARD], [7, 7, BEARD], [8, 7, BEARD], [9, 7, BEARD], [10, 7, ROBE], [11, 7, ROBE],
  // robe body with trim
  [3, 8, ROBE], [4, 8, ROBE], [5, 8, ROBE_DARK], [6, 8, ROBE], [7, 8, ROBE], [8, 8, ROBE], [9, 8, ROBE], [10, 8, ROBE_DARK], [11, 8, ROBE], [12, 8, ROBE],
  [2, 9, ORB], [3, 9, ROBE], [4, 9, ROBE], [5, 9, TRIM], [6, 9, ROBE], [7, 9, ROBE], [8, 9, ROBE], [9, 9, TRIM], [10, 9, ROBE], [11, 9, ROBE], [12, 9, ROBE],
  [2, 10, '#8a5a1a'], [3, 10, ROBE], [4, 10, ROBE], [5, 10, ROBE], [6, 10, ROBE], [7, 10, ROBE], [8, 10, ROBE], [9, 10, ROBE], [10, 10, ROBE], [11, 10, ROBE],
  [2, 11, '#8a5a1a'], [3, 11, ROBE], [4, 11, ROBE_DARK], [5, 11, ROBE_DARK], [6, 11, ROBE_DARK], [7, 11, ROBE_DARK], [8, 11, ROBE_DARK], [9, 11, ROBE_DARK], [10, 11, ROBE], [11, 11, ROBE],
  // hem
  [3, 12, ROBE_DARK], [4, 12, ROBE_DARK], [5, 12, ROBE_DARK], [6, 12, ROBE_DARK], [7, 12, ROBE_DARK], [8, 12, ROBE_DARK], [9, 12, ROBE_DARK], [10, 12, ROBE_DARK], [11, 12, ROBE_DARK],
]

export function ScholarSprite({ className }: { className?: string }) {
  return <PixelSprite className={className} pixels={scholarPixels} />
}

export function SageSprite({ className }: { className?: string }) {
  return <PixelSprite className={className} pixels={sagePixels} />
}
