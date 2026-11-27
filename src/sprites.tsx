/**
 * Original pixel art, drawn as character grids and rendered as crisp SVG rectangles.
 * '.' is transparent; every other character is looked up in the palette.
 */
import type { CSSProperties, ReactNode } from 'react'
import type { EnemyId, Location, Npc } from './game/content.ts'

type Palette = Record<string, string>

export function Sprite({
  rows,
  palette,
  size,
  className,
  style,
  flip,
}: {
  rows: string[]
  palette: Palette
  size?: number
  className?: string
  style?: CSSProperties
  flip?: boolean
}) {
  const width = Math.max(...rows.map((r) => r.length))
  const rects: ReactNode[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const char = row[x]!
      let end = x + 1
      while (end < row.length && row[end] === char) end++
      if (char !== '.' && palette[char]) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={palette[char]} />)
      }
      x = end
    }
  })
  return (
    <svg
      viewBox={`0 0 ${width} ${rows.length}`}
      width={size ? size * width : undefined}
      height={size ? size * rows.length : undefined}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ ...style, transform: flip ? 'scaleX(-1)' : style?.transform }}
    >
      {rects}
    </svg>
  )
}

/* ---------- Characters ---------- */

const PERSON = [
  '...HHHH...',
  '..HHHHHH..',
  '..RRRRRR..',
  '..SSSSSS..',
  '..SKSSKS..',
  '..SSSSSS..',
  '...SMMS...',
  '..BBBBBB..',
  '.BBBBBBBB.',
  '.SBBBBBBS.',
  '..BBBBBB..',
  '..NN..NN..',
  '..NN..NN..',
  '.DDD..DDD.',
]

export const HERO_PALETTE: Palette = {
  H: '#3B2416',
  R: '#E84855',
  S: '#F2C49B',
  K: '#1B1F2E',
  M: '#C9785A',
  B: '#4776D0',
  N: '#17213B',
  D: '#1B1F2E',
}

export const Hero = ({ size = 4, flip, className }: { size?: number; flip?: boolean; className?: string }) => (
  <Sprite rows={PERSON} palette={HERO_PALETTE} size={size} flip={flip} className={className} />
)

export const NpcSprite = ({ npc, size = 4, className }: { npc: Npc; size?: number; className?: string }) => (
  <Sprite
    rows={PERSON}
    palette={{ ...HERO_PALETTE, H: npc.hair, R: npc.hair, S: npc.skin, B: npc.shirt, M: '#B0624A', N: '#3A3F52' }}
    size={size}
    className={className}
  />
)

/* ---------- Buildings ---------- */

const HOUSE = [
  '..........CC....',
  '......RRRRCC....',
  '.....RRRRRRR....',
  '....RRRRRRRRR...',
  '...RRRRRRRRRRR..',
  '..RRRRRRRRRRRRR.',
  '.RRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRR',
  '.WWWWWWWWWWWWWW.',
  '.WGGWWWWWWWWGGW.',
  '.WGGWWWDDWWWGGW.',
  '.WWWWWWDDWWWWWW.',
  '.WWWWWWDDWWWWWW.',
  '.SSSSSSSSSSSSSS.',
]

const TOWER = [
  'K.K.K.K.K.K.',
  'KKKKKKKKKKKK',
  '.KMMMMMMMMK.',
  '.KMMEEEEMMK.',
  '.KMMEPPEMMK.',
  '.KMMEEEEMMK.',
  '.KMMMMMMMMK.',
  '.KMMGGMMGGK.',
  '.KMMMMMMMMK.',
  '.KMMGGMMGGK.',
  '.KMMMMMMMMK.',
  '.KMMMMMMMMK.',
  '.KMMMDDMMMK.',
  '.KMMMDDMMMK.',
  'KKKKKKKKKKKK',
]

const FREED_TOWER = ['....F.......', '....FFFF....', '....FFF.....', '....F.......', ...TOWER.slice(1)]

export function BuildingSprite({ location, freed }: { location: Location; freed?: boolean }) {
  if (location.id === 'tower') {
    return freed ? (
      <Sprite rows={FREED_TOWER} palette={{ F: '#63B75D', K: '#1B1F2E', M: '#C9B48A', E: '#F5C451', P: '#FFF1C7', G: '#4776D0', D: '#7A4A2A' }} />
    ) : (
      <Sprite rows={TOWER} palette={{ K: '#0E1528', M: '#3A3F52', E: '#1B1F2E', P: '#E84855', G: '#E84855', D: '#0E1528' }} />
    )
  }
  return (
    <Sprite
      rows={HOUSE}
      palette={{ R: location.roof, W: location.wall, C: '#7A4A2A', G: '#8FC6F0', D: '#7A4A2A', S: '#8A8F9E' }}
    />
  )
}

export const Tree = () => (
  <Sprite
    rows={['..GGGG..', '.GGLGGG.', 'GGGGGLGG', 'GLGGGGGG', 'GGGGLGGG', '.GGGGGG.', '..GGGG..', '...TT...', '...TT...', '..TTTT..']}
    palette={{ G: '#2F7D3A', L: '#4FA35A', T: '#7A4A2A' }}
  />
)

/* ---------- Enemies ---------- */

const ENEMIES: Record<EnemyId, { rows: string[]; palette: Palette }> = {
  lockin: {
    rows: [
      '...GGGGGG...',
      '..GG....GG..',
      '..G......G..',
      '..G......G..',
      'PPPPPPPPPPPP',
      'PPPPPPPPPPPP',
      'PPWKPPPPWKPP',
      'PPKKPPPPKKPP',
      'PPPPPKKPPPPP',
      'PPPPKKKKPPPP',
      'PPPPPPPPPPPP',
      '.PP......PP.',
    ],
    palette: { G: '#9AA3B5', P: '#8B5CC4', W: '#FFF1C7', K: '#1B1F2E' },
  },
  licenses: {
    rows: [
      '....YYYY....',
      '..YYYYYYYY..',
      '.YYOOOOOOYY.',
      '.YOWKOOWKOY.',
      'YYOKKOOKKOYY',
      'YYOOOOOOOOYY',
      'YYOOKKKKOOYY',
      'YYOOKWWKOOYY',
      '.YOOOOOOOOY.',
      '.YYOOOOOOYY.',
      '..YYYYYYYY..',
      '...Y....Y...',
    ],
    palette: { Y: '#C8962A', O: '#F5C451', W: '#FFF1C7', K: '#1B1F2E' },
  },
  data: {
    rows: [
      '..PPPPPPPP..',
      '.PPPPPPPPPP.',
      'PPWWWWWWWWPP',
      'PWWWBBBBWWWP',
      'PWWBBKKBBWWP',
      'PWWBBKKBBWWP',
      'PWWWBBBBWWWP',
      'PPWWWWWWWWPP',
      '.PPPPPPPPPP.',
      '..P.P..P.P..',
      '.P..P..P..P.',
      'P...P..P...P',
    ],
    palette: { P: '#E84855', W: '#FFF1C7', B: '#4776D0', K: '#1B1F2E' },
  },
  obsolescence: {
    rows: [
      'BBBBBBBBBBBB',
      '.BGGGGGGGGB.',
      '..BGWKGWKB..',
      '...BGGGGB...',
      '....BYYB....',
      '.....YY.....',
      '.....YY.....',
      '....BYYB....',
      '...BGYYGB...',
      '..BGYYYYGB..',
      '.BYYYYYYYYB.',
      'BBBBBBBBBBBB',
    ],
    palette: { B: '#7A4A2A', G: '#BFE3F2', Y: '#F5C451', W: '#FFF1C7', K: '#1B1F2E' },
  },
  cloud: {
    rows: [
      '...Y.Y.Y....',
      '...YYYYY....',
      '..CCCCCCC...',
      '.CCCCCCCCCC.',
      'CCWKCCCWKCCC',
      'CCKKCCCKKCCC',
      'CCCCCCCCCCCC',
      'CCCKKKKKCCCC',
      '.CCCCCCCCCC.',
      '..CC..CC....',
      '..B...B..B..',
      '....B...B...',
    ],
    palette: { Y: '#F5C451', C: '#DDE6F0', W: '#FFFFFF', K: '#1B1F2E', B: '#4776D0' },
  },
  interop: {
    rows: [
      'RRRRRRRRRRRR',
      'RMRRRMRRRMRR',
      'RRRRRRRRRRRR',
      'RRMRWKRWKRMR',
      'RRRRKKRKKRRR',
      'RMRRRRRRRMRR',
      'RRRKKKKKKRRR',
      'RRRKWKWKKRRR',
      'RRMRRRRRRMRR',
      'RRRRRRRRRRRR',
      'RMRRRMRRRMRR',
      'RR........RR',
    ],
    palette: { R: '#C4553A', M: '#8E3A25', W: '#FFF1C7', K: '#1B1F2E' },
  },
}

export const EnemySprite = ({ id, size, className }: { id: EnemyId; size?: number; className?: string }) => (
  <Sprite rows={ENEMIES[id].rows} palette={ENEMIES[id].palette} size={size} className={className} />
)

export const Coin = ({ size = 2 }: { size?: number }) => (
  <Sprite rows={['.YYYY.', 'YYWYYY', 'YWYYOY', 'YWYYOY', 'YYYYOY', '.YOOO.']} palette={{ Y: '#F5C451', W: '#FFF1C7', O: '#C8962A' }} size={size} />
)
