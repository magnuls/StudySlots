export interface Bounds {
  min: number
  max: number
}

// Chunky +/- steppers instead of native number inputs — the browser spinner
// arrows overlapped the value and clipped at small widths.
function Stepper({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled: boolean
}) {
  // floor at 0, hard cap at 999 minutes
  const step = (d: number) => onChange(Math.max(0, Math.min(999, value + d)))
  return (
    <div className="flex items-center gap-1.5">
      {/* extra right margin so the minus button's outward border can't cover the label */}
      <span className="mr-2.5 font-pixel text-[8px] text-plumdark">{label}</span>
      <button
        onClick={() => step(-15)}
        disabled={disabled}
        aria-label={`decrease ${label}`}
        className="pixel-border h-8 w-8 bg-coral font-pixel text-[12px] leading-none text-cream transition-transform hover:scale-105 active:translate-y-0.5 active:scale-90 disabled:opacity-50"
      >
        -
      </button>
      <div className="pixel-border flex h-8 w-14 items-center justify-center bg-white font-pixel text-[11px] text-plumdark">
        {value}
      </div>
      <button
        onClick={() => step(15)}
        disabled={disabled}
        aria-label={`increase ${label}`}
        className="pixel-border h-8 w-8 bg-mint font-pixel text-[12px] leading-none text-plumdark transition-transform hover:scale-105 active:translate-y-0.5 active:scale-90 disabled:opacity-50"
      >
        +
      </button>
    </div>
  )
}

export default function BoundsInput({
  bounds,
  onChange,
  disabled = false,
}: {
  bounds: Bounds
  onChange: (b: Bounds) => void
  disabled?: boolean
}) {
  return (
    <div className="pixel-border flex w-full flex-col gap-3 bg-lilac/90 px-4 py-3">
      <div className="text-center font-pixel text-[8px] text-plumdark">BOUNDS · MINUTES</div>
      <div className="flex items-center justify-between px-2">
        <Stepper
          label="MIN"
          value={bounds.min}
          onChange={(v) => onChange({ ...bounds, min: v })}
          disabled={disabled}
        />
        <Stepper
          label="MAX"
          value={bounds.max}
          onChange={(v) => onChange({ ...bounds, max: v })}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
