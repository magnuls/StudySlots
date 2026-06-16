export type SpriteName = 'star' | 'heart' | 'diamond' | 'cherry' | 'coin' | 'seven' | 'crown' | 'bunny'

// Each sprite is a char grid; '.' is transparent, other chars map to palette colors.
const GRIDS: Record<SpriteName, { rows: string[]; palette: Record<string, string> }> = {
  star: {
    rows: ['...Y...', '...Y...', 'YYYYYYY', '.YYYYY.', '..YYY..', '.YY.YY.'],
    palette: { Y: '#ffc83d' },
  },
  heart: {
    rows: ['.PP.PP.', 'PPPPPPP', 'PWPPPPP', '.PPPPP.', '..PPP..', '...P...'],
    palette: { P: '#ff5fa2', W: '#ffd6ec' },
  },
  diamond: {
    rows: ['..BBB..', '.BBBBB.', 'BBWBBBB', '.BBBBB.', '..BBB..', '...B...'],
    palette: { B: '#9ad8ff', W: '#ffffff' },
  },
  cherry: {
    rows: ['....G..', '...GG..', '..G.G..', '.RR.RR.', 'RRRRRRR', 'RWR.RWR', '.RR.RR.'],
    palette: { G: '#7de8b6', R: '#ff5f6e', W: '#ffd6ec' },
  },
  coin: {
    rows: ['..YYY..', '.YYYYY.', 'YYWYYYY', 'YYWYYYY', '.YYYYY.', '..YYY..'],
    palette: { Y: '#ffc83d', W: '#fff7e6' },
  },
  seven: {
    rows: ['RRRRRR', 'RRRRRR', '...RR.', '..RR..', '.RR...', '.RR...'],
    palette: { R: '#ff8a72' },
  },
  crown: {
    rows: ['Y..Y..Y', 'Y..Y..Y', 'YYYYYYY', 'YYRYRYY', 'YYYYYYY'],
    palette: { Y: '#ffc83d', R: '#ff4757' },
  },
  bunny: {
    rows: ['.P....P.', '.P....P.', 'PPPPPPPP', 'PKPPPPKP', 'PPPRRPPP', '.PPPPPP.', '.PP..PP.'],
    palette: { P: '#ffa3d1', K: '#43294a', R: '#ff5fa2' },
  },
}

export default function PixelSprite({
  name,
  size = 4,
  className = '',
}: {
  name: SpriteName
  size?: number
  className?: string
}) {
  const { rows, palette } = GRIDS[name]
  const cols = rows[0].length
  return (
    <svg
      width={cols * size}
      height={rows.length * size}
      className={className}
      style={{ imageRendering: 'pixelated' }}
      aria-hidden
    >
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === '.' ? null : (
            <rect key={`${x}-${y}`} x={x * size} y={y * size} width={size} height={size} fill={palette[ch]} />
          )
        )
      )}
    </svg>
  )
}
