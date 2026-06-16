import { useEffect, useRef, useState } from 'react'

export const REEL_ITEM_H = 64

// During a spin we build a strip of fake values that scrolls past and lands on
// the real result. The strip starts at whatever was last shown so the motion
// is continuous, and each reel gets a longer strip + duration for the
// staggered left → middle → right stop.
export default function Reel({
  index,
  durations,
  spinning,
  finalValue,
  onStop,
}: {
  index: number
  durations: number[]
  spinning: boolean
  finalValue: number | null
  onStop: (index: number) => void
}) {
  const [strip, setStrip] = useState<Array<number | null>>([null])
  const [offset, setOffset] = useState(0)
  const [animMs, setAnimMs] = useState(0)
  const stopTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!spinning || finalValue == null) return
    const count = 16 + index * 8
    const fakes = Array.from(
      { length: count },
      () => durations[Math.floor(Math.random() * durations.length)] ?? finalValue
    )
    const current = strip[strip.length - 1]
    const next: Array<number | null> = [current, ...fakes, finalValue]
    const durMs = 1450 + index * 480

    setStrip(next)
    setOffset(0)
    setAnimMs(0)
    // double rAF so the browser paints the reset position before animating
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimMs(durMs)
        setOffset((next.length - 1) * REEL_ITEM_H)
      })
    })
    stopTimer.current = window.setTimeout(() => onStop(index), durMs)
    return () => window.clearTimeout(stopTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning])

  return (
    <div
      className="pixel-border overflow-hidden bg-white"
      style={{ height: REEL_ITEM_H, width: 94 }}
    >
      <div
        className={spinning ? 'reel-spinning' : ''}
        style={{
          transform: `translateY(-${offset}px)`,
          transition: animMs ? `transform ${animMs}ms cubic-bezier(0.12, 0.65, 0.28, 1)` : 'none',
        }}
      >
        {strip.map((v, i) => (
          <div
            key={i}
            className="flex items-center justify-center font-pixel text-[19px] text-[#e8333f]"
            style={{ height: REEL_ITEM_H }}
          >
            {v == null ? (
              <span className="qmark-bounce" style={{ animationDelay: `${index * 0.18}s` }}>
                ?
              </span>
            ) : (
              v
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
