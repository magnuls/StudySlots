export type Mood = 'idle' | 'excited' | 'cheer'

// A tiny pixel student: oversized glasses, pink shirt, blue book in hand.
const ROWS = [
  '...HHHHHH...',
  '..HHHHHHHH..',
  '..SSSSSSSS..',
  '.GGGGSSGGGG.',
  '.GWWGSSGWWG.',
  '.GGGGSSGGGG.',
  '..SSSSSSSS..',
  '..SRSMMSRS..',
  '..PPPPPPPP..',
  '.PPPPPPPPPP.',
  '.SPBBBBBBPS.',
  '.SBBBBBBBBS.',
  '..BBBBBBBB..',
  '..BWWBBWWB..',
  '...DD..DD...',
  '...DD..DD...',
]

const PALETTE: Record<string, string> = {
  H: '#8a5a44', // hair
  S: '#ffd9b8', // skin
  G: '#43294a', // glasses frame
  W: '#ffffff', // lenses / book pages
  M: '#d2527f', // mouth
  R: '#ff9eb5', // rosy cheeks
  P: '#ff8ac2', // shirt
  B: '#6fb7ff', // book
  D: '#7c6bb1', // pants
}

const MOOD_CLASS: Record<Mood, string> = {
  idle: 'char-idle',
  excited: 'char-excited',
  cheer: 'char-cheer',
}

export default function PixelCharacter({ mood = 'idle', size = 5 }: { mood?: Mood; size?: number }) {
  const cols = ROWS[0].length
  return (
    <div className={MOOD_CLASS[mood]} title="your study buddy">
      <svg
        width={cols * size}
        height={ROWS.length * size}
        style={{ imageRendering: 'pixelated' }}
        aria-label="pixel student"
      >
        {ROWS.flatMap((row, y) =>
          [...row].map((ch, x) =>
            ch === '.' ? null : (
              <rect key={`${x}-${y}`} x={x * size} y={y * size} width={size} height={size} fill={PALETTE[ch]} />
            )
          )
        )}
      </svg>
    </div>
  )
}
