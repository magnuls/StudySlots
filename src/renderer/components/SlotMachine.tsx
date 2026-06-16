import { useEffect, useMemo, useState } from 'react'
import Reel, { REEL_ITEM_H } from './Reel'
import PixelSprite from './PixelSprite'

const MACHINE_W = 400

function MarqueeLights() {
  // dots placed around the cabinet border, with delays that chase clockwise
  // a dense rope-light strip: 100 tiny bulbs per side, chasing clockwise
  const dots = useMemo(() => {
    const perEdge = 100
    const out: Array<{ x: number; y: number; order: number }> = []
    for (let i = 0; i < perEdge; i++) out.push({ x: (i / perEdge) * 100, y: 0, order: i })
    for (let i = 0; i < perEdge; i++)
      out.push({ x: 100, y: (i / perEdge) * 100, order: perEdge + i })
    for (let i = 0; i < perEdge; i++)
      out.push({ x: 100 - (i / perEdge) * 100, y: 100, order: perEdge * 2 + i })
    for (let i = 0; i < perEdge; i++)
      out.push({ x: 0, y: 100 - (i / perEdge) * 100, order: perEdge * 3 + i })
    return out
  }, [])

  return (
    // -inset-1 puts the strip on top of the cabinet's black border
    <div className="pointer-events-none absolute -inset-1 z-10">
      {dots.map((d) => (
        <div
          key={d.order}
          className="marquee-dot"
          style={{
            left: `calc(${d.x}% - 6px)`,
            top: `calc(${d.y}% - 6px)`,
            // negative delay: every bulb is already mid-animation on mount,
            // so the strip is fully lit the moment the app opens
            animationDelay: `-${d.order * 0.012}s`,
          }}
        />
      ))}
    </div>
  )
}

function Sparkles({ burstKey }: { burstKey: number }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 8 }, () => ({
        left: 8 + Math.random() * 84,
        top: Math.random() * 90,
        delay: Math.random() * 0.3,
        size: 10 + Math.random() * 8,
      })),
    [burstKey]
  )
  if (!burstKey) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {sparks.map((s, i) => (
        <span
          key={`${burstKey}-${i}`}
          className="sparkle font-pixel text-gold"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: s.size,
            animationDelay: `${s.delay}s`,
            textShadow: '0 0 6px #ffc83d',
          }}
        >
          ✦
        </span>
      ))}
    </div>
  )
}

export default function SlotMachine({
  durations,
  spinning,
  result,
  timerText,
  onLever,
  leverDisabled,
  onReelStop,
  sparkleKey,
}: {
  durations: number[]
  spinning: boolean
  result: number | null
  timerText: { mm: string; ss: string } | null
  onLever: () => void
  leverDisabled: boolean
  onReelStop: (index: number) => void
  sparkleKey: number
}) {
  const [pulled, setPulled] = useState(false)

  // animate the lever (and the bunny riding it) whenever a spin starts,
  // whether it came from the lever itself or the SPIN button
  useEffect(() => {
    if (!spinning) return
    setPulled(true)
    const t = window.setTimeout(() => setPulled(false), 600)
    return () => window.clearTimeout(t)
  }, [spinning])

  return (
    <div className="relative" style={{ width: MACHINE_W + 44 }}>
      <div className="relative" style={{ width: MACHINE_W }}>
        <MarqueeLights />
        <Sparkles burstKey={sparkleKey} />

        {/* golden crown, like the reference */}
        <div className="absolute -top-8 left-1/2 z-20 -translate-x-1/2">
          <PixelSprite name="crown" size={6} />
        </div>

        {/* cabinet — shiny gold */}
        <div
          className="pixel-border gold-shine relative rounded-2xl p-4 shadow-[0_8px_0_#b07a0a]"
          style={{ width: MACHINE_W }}
        >
          {/* JACKPOT sign: gold on deep red with gold trim */}
          <div className="mb-3 mt-1 border-4 border-[#000] bg-[#c2103a] py-2 text-center font-pixel text-[12px] tracking-widest text-gold shadow-[inset_0_0_0_3px_#ffc83d]">
            {timerText ? 'STUDY TIME' : '★ JACKPOT ★'}
          </div>

          {/* the cabinet still has a little face: blinking eyes + rosy cheeks */}
          <div className="mb-2 flex items-center justify-center gap-3">
            <div className="h-3 w-3 rounded-full bg-[#ffd6ec]/80" />
            <div className="eye h-4 w-3 rounded-sm bg-plumdark" />
            <div className="h-2 w-4 rounded-full bg-plumdark/30" />
            <div className="eye h-4 w-3 rounded-sm bg-plumdark" />
            <div className="h-3 w-3 rounded-full bg-[#ffd6ec]/80" />
          </div>

          {/* reel window / timer display — white bezel, red digits */}
          <div className="pixel-border flex items-center justify-center gap-4 bg-[#f7f7fb] p-4">
            {timerText ? (
              <>
                <div
                  className="pixel-border flex items-center justify-center bg-white font-pixel text-[26px] text-[#e8333f]"
                  style={{ height: REEL_ITEM_H, width: 124 }}
                >
                  {timerText.mm}
                </div>
                <div className="colon-blink font-pixel text-[26px] text-[#e8333f]">:</div>
                <div
                  className="pixel-border flex items-center justify-center bg-white font-pixel text-[26px] text-[#e8333f]"
                  style={{ height: REEL_ITEM_H, width: 124 }}
                >
                  {timerText.ss}
                </div>
              </>
            ) : (
              [0, 1, 2].map((i) => (
                <Reel
                  key={i}
                  index={i}
                  durations={durations}
                  spinning={spinning}
                  finalValue={result}
                  onStop={onReelStop}
                />
              ))
            )}
          </div>

          {timerText && (
            <div className="mt-2 text-center font-pixel text-[7px] text-plumdark/80">
              KEEP GOING! YOU GOT THIS ♥
            </div>
          )}

          {/* gold coin tray, flat pixel style like the reference */}
          <div className="mx-auto mt-5 flex h-12 w-48 items-center justify-center border-4 border-black bg-[#ffd95e] shadow-[inset_0_4px_0_#ffe98c,inset_0_-4px_0_#d9a514]">
            <div className="flex h-4 w-32 items-center justify-center border-2 border-black bg-[#e08a2e]">
              <div className="h-1 w-24 bg-[#7e2f0d]" />
            </div>
          </div>
        </div>
      </div>

      {/* lever */}
      <button
        onClick={() => {
          if (!leverDisabled) onLever()
        }}
        disabled={leverDisabled}
        aria-label="pull lever to spin"
        className="no-drag absolute -right-1 top-10 z-20 h-44 w-11 disabled:opacity-60"
      >
        <div className={`lever-arm ${pulled ? 'pulled' : ''}`}>
          <div className="lever-ball" />
          <div className="lever-stick" />
        </div>

        {/* little bunny that grabs on and rides the lever down — above the lights */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: -34,
            top: 38,
            zIndex: 30,
            transform: pulled ? 'translateY(44px)' : 'translateY(0)',
            transition: 'transform 0.22s cubic-bezier(0.6, -0.3, 0.3, 1.7)',
          }}
        >
          <div className="bob" style={{ animationDuration: '3s' }}>
            <PixelSprite name="bunny" size={6} />
          </div>
        </div>

        <div className="lever-base" />
      </button>
    </div>
  )
}
