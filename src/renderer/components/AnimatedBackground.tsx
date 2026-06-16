import { useMemo } from 'react'
import PixelSprite, { SpriteName } from './PixelSprite'

const NAMES: SpriteName[] = ['star', 'heart', 'diamond', 'cherry', 'coin', 'seven']

interface Sprite {
  name: SpriteName
  left: number
  top: number
  delay: number
  duration: number
  scale: number
  opacity: number
}

// Three parallax layers: near sprites are bigger, faster, and more opaque.
const LAYERS = [
  { count: 9, scale: 1.6, opacity: 0.45, speed: 5 },
  { count: 8, scale: 1.1, opacity: 0.32, speed: 7.5 },
  { count: 8, scale: 0.7, opacity: 0.22, speed: 10 },
]

export default function AnimatedBackground() {
  const layers = useMemo(
    () =>
      LAYERS.map((layer, l) =>
        Array.from({ length: layer.count }, (_, i): Sprite => ({
          name: NAMES[(i + l) % NAMES.length],
          left: Math.random() * 92,
          top: 4 + Math.random() * 90,
          delay: Math.random() * 8,
          duration: layer.speed + Math.random() * 3,
          scale: layer.scale,
          opacity: layer.opacity,
        }))
      ),
    []
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {layers.map((sprites, l) => (
        <div key={l} className="absolute inset-0">
          {sprites.map((s, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                opacity: s.opacity,
                transform: `scale(${s.scale})`,
              }}
            >
              <div
                className="bob"
                style={{ animationDelay: `-${s.delay}s`, animationDuration: `${s.duration}s` }}
              >
                <PixelSprite name={s.name} size={4} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
