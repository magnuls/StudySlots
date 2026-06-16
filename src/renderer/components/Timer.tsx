import PixelButton from './PixelButton'

// The digits themselves render inside the slot machine's reel windows;
// this component is the controls underneath.
export default function Timer({
  paused,
  onPause,
  onResume,
  onDoneEarly,
  subjectLabel,
}: {
  paused: boolean
  onPause: () => void
  onResume: () => void
  onDoneEarly: () => void
  subjectLabel: string
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="font-pixel text-[9px] text-plumdark">
        {paused ? '⏸ PAUSED' : `STUDYING ${subjectLabel}…`}
      </div>
      <div className="flex gap-6">
        <PixelButton variant="mint" onClick={paused ? onResume : onPause}>
          {paused ? 'Resume' : 'Pause'}
        </PixelButton>
        <PixelButton variant="pink" onClick={onDoneEarly}>
          I'm done early
        </PixelButton>
      </div>
    </div>
  )
}
